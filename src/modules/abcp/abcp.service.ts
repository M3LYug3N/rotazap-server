import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";

import { abcpHttpRequest } from "@/modules/abcp/utils/abcp-http-client";
import { generateBasketHash } from "@/modules/abcp/utils/hash";
import { PrismaService } from "@/modules/prisma/prisma.service";

import abcpConfig from "@/config/abcp.config";

import type {
  ArticleInfoDto,
  CrossItemDto,
  LocalOffer,
  LocalOfferGroup,
} from "./dto/article-info.dto";

@Injectable()
export class AbcpService {
  private readonly logger = new Logger(AbcpService.name);

  constructor(
    @Inject(abcpConfig.KEY)
    private readonly config: ConfigType<typeof abcpConfig>,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Выполняет запрос к ABCP API через общий HTTP-клиент.
   *
   * Оборачивает вызов `abcpHttpRequest`, автоматически подставляя
   * параметры авторизации из конфигурации модуля.
   *
   * @param endpoint - Путь запроса (например, "/articles/info")
   * @param params - Дополнительные параметры запроса (артикул, бренд и т.д.)
   *
   * @returns Ответ от ABCP API
   *
   * @throws InternalServerErrorException - В случае ошибки выполнения запроса
   */
  private async performRequest(
    endpoint: string,
    params: Record<string, any>,
  ): Promise<any> {
    const { host, login, password } = this.config;

    return abcpHttpRequest({
      host,
      login,
      password,
      endpoint,
      params,
    });
  }

  async getBrandsDictionary(): Promise<any> {
    return this.performRequest("/articles/brands", {});
  }

  async searchBrands(number: string): Promise<any> {
    return this.performRequest("/search/brands", { number });
  }

  async getSearchTips(number: string): Promise<any> {
    return this.performRequest("/search/tips", { number });
  }

  async getArticleInfo(
    brand: string,
    number: string,
    format = "bnphic",
    locale = "ru_RU",
  ): Promise<any> {
    const data = await this.performRequest("/articles/info", {
      brand,
      number,
      format,
      locale,
    });

    if (data?.images?.length) {
      this.logger.log(
        `📸 Images found for ${brand} ${number}: ${JSON.stringify(data.images)}`,
      );
      data.images = data.images.map((img) => ({
        name: img.name,
        url: `https://pubimg.nodacdn.net/images/${img.name}`,
      }));
    } else {
      this.logger.warn(`❌ No images found for ${brand} ${number}`);
    }

    return data;
  }

  /**
   * Расширенный поиск: локальные офферы показываются
   * ТОЛЬКО при наличии цены в offer_price для текущего priceListId.
   */
  async getEnrichedArticleInfo(
    brand: string,
    number: string,
    userId: number,
    format = "bnphic",
    locale = "ru_RU",
  ): Promise<ArticleInfoDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, priceListId: true },
    });
    if (!user) throw new NotFoundException("Пользователь не найден");

    const priceListId = user.priceListId ?? 1;

    const abcpData = await this.getArticleInfo(brand, number, format, locale);

    const crossItems: CrossItemDto[] = [
      { brand: abcpData.brand, number: abcpData.number },
      ...(abcpData.crosses ?? []),
    ];

    const originalArticle = abcpData.numberFix ?? abcpData.number;

    // локальные офферы строго по текущему прайсу
    const allOffers = await this.loadLocalOffers(crossItems, priceListId);

    const sortByWarehouseFirstThenPrice = <
      T extends { supplierId: number; price: number },
    >(
      a: T,
      b: T,
    ): number => {
      const isAOur = a.supplierId === 0;
      const isBOur = b.supplierId === 0;
      if (isAOur && !isBOur) return -1;
      if (!isAOur && isBOur) return 1;
      return a.price - b.price;
    };

    return {
      brand: abcpData.brand,
      number: abcpData.number,
      descr: abcpData.descr ?? "",
      properties: abcpData.properties,
      images: abcpData.images?.map((img: any) => img.url) ?? [],
      crosses: abcpData.crosses ?? [],
      localOffers: [
        {
          groupName: "Запрошенный (оригинальный) артикул",
          items: allOffers
            .filter((g) => g.number === originalArticle)
            .map((group) => ({
              ...group,
              offers: [...group.offers].sort(sortByWarehouseFirstThenPrice),
            })),
        },
        {
          groupName: "Аналоги (заменители) запрошенного артикула",
          items: allOffers
            .filter((g) => g.number !== originalArticle)
            .flatMap((group) =>
              group.offers.map((offer) => ({
                ...group,
                offers: [offer],
              })),
            )
            .sort((a, b) =>
              sortByWarehouseFirstThenPrice(a.offers[0], b.offers[0]),
            ),
        },
      ],
    };
  }

  /**
   * Собирает локальные офферы по списку (brand, number) с фильтрацией
   * по нужному priceListId. Если цены в offer_price нет — оффер не попадает.
   */
  private async loadLocalOffers(
    crosses: CrossItemDto[],
    priceListId: number,
  ): Promise<LocalOfferGroup[]> {
    const brandNames = [
      ...new Set(crosses.map((c) => c.brand).filter(Boolean)),
    ];
    const articles = [...new Set(crosses.map((c) => c.number).filter(Boolean))];

    if (!brandNames.length || !articles.length) return [];

    const brands = await this.prisma.brands.findMany({
      where: { name: { in: brandNames } },
      select: { id: true, name: true },
    });

    const skuRecords = await this.prisma.sku.findMany({
      where: {
        article: { in: articles },
        brandId: { in: brands.map((b) => b.id) },
      },
      include: { brand: true },
    });

    const skuIds = skuRecords.map((s) => s.id);
    if (!skuIds.length) return [];

    // 1) Берём только цены из нужного прайс-листа
    const [offerPrices, suppliersOffers] = await Promise.all([
      this.prisma.offerPrice.findMany({
        where: { skuId: { in: skuIds }, priceListId },
        select: { skuId: true, supplierId: true, price: true },
      }),
      this.prisma.suppliersOffers.findMany({
        where: { skuId: { in: skuIds } },
        select: {
          skuId: true,
          supplierId: true,
          basePrice: true,
          qty: true,
          supplier: { select: { deliveryDays: true } },
        },
      }),
    ]);

    // Для быстрого доступа делаем индекс цен по (skuId, supplierId)
    const priceKey = (skuId: number, supplierId: number) =>
      `${skuId}:${supplierId}`;
    const priceMap = new Map<string, number>();
    for (const p of offerPrices) {
      priceMap.set(priceKey(p.skuId, p.supplierId), p.price);
    }

    return skuRecords.map((sku): LocalOfferGroup => {
      const offers: LocalOffer[] = [];

      // все поставщики по SKU (есть basePrice/qty)
      const supplierEntries = suppliersOffers.filter((s) => s.skuId === sku.id);

      for (const s of supplierEntries) {
        if (s.qty <= 0) continue;

        // цена из offer_price ТОЛЬКО для текущего прайс-листа
        const price = priceMap.get(priceKey(sku.id, s.supplierId));
        if (price == null) continue; // нет записи в offer_price — оффер скрываем

        const deliveryDays = s.supplier?.deliveryDays ?? 0;

        const hash = generateBasketHash(
          sku.id,
          s.supplierId,
          s.basePrice, // basePrice просто прокидываем в hash/БД
          price, // пользовательская цена из offer_price
          s.qty,
          deliveryDays,
        );

        offers.push({
          skuId: sku.id,
          supplierId: s.supplierId,
          basePrice: s.basePrice,
          price,
          qty: s.qty,
          hash,
          deliveryDays,
        });
      }

      return {
        brand: sku.brand.name,
        number: sku.article,
        offers,
      };
    });
  }
}
