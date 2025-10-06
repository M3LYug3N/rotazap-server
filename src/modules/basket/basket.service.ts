import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AbcpService } from "@/modules/abcp/abcp.service";
import { AddBasketItemDto } from "@/modules/basket/dto/add-basket-item.dto";
import { BasketDiffItem } from "@/modules/basket/dto/basket-diff-item.dto";
import { BasketItemResponseDto } from "@/modules/basket/dto/basket-item-response.dto";
import { CompareBasketItemDto } from "@/modules/basket/dto/compare-basket.dto";
import { DeleteBasketItemDto } from "@/modules/basket/dto/delete-basket-item.dto";
import { RemoveBasketItemDto } from "@/modules/basket/dto/remove-basket-item.dto";
import { defaultBasketHash } from "@/modules/basket/utils/hash.util";

import { mapBasketToResponse } from "./basket.mapper";
import { BasketRepo } from "./basket.repo";

@Injectable()
export class BasketService {
  constructor(
    private readonly repo: BasketRepo,
    private readonly abcpService: AbcpService,
  ) {}

  private async ensureUserExists(userId: number): Promise<void> {
    if (!(await this.repo.userExists(userId))) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  /** Текущий прайс-лист пользователя (дефолт 1). */
  private async resolvePriceListId(userId: number): Promise<number> {
    const id = await this.repo.getUserPriceListId(userId);
    return id ?? 1;
  }

  async addToBasket(
    userId: number,
    dto: AddBasketItemDto,
  ): Promise<BasketItemResponseDto> {
    await this.ensureUserExists(userId);
    const priceListId = await this.resolvePriceListId(userId);

    const { skuId, supplierId, qty = 1, hash, descr } = dto;
    const finalHash = hash ?? defaultBasketHash(skuId, supplierId);

    // цена/остаток строго из offer_price для текущего priceListId
    const offer = await this.repo.getOfferSnapshot(
      skuId,
      supplierId,
      priceListId,
    );
    if (offer.qty < 1) throw new BadRequestException("Out of stock");

    const existing = await this.repo.findItemQty({
      userId,
      skuId,
      supplierId,
      hash: finalHash,
    });
    const newQty = (existing?.qty ?? 0) + qty;
    if (newQty > offer.qty)
      throw new BadRequestException(`Максимум ${offer.qty} шт.`);

    // Описание, если не пришло
    let finalDescr = descr;
    if (!finalDescr) {
      const sku = await this.repo.getSkuBrief(skuId);
      const enriched = await this.abcpService.getEnrichedArticleInfo(
        sku.brand.name,
        sku.article,
        userId,
      );
      finalDescr = enriched.descr ?? "";
    }

    const item = await this.repo.upsertItem({
      userId,
      skuId,
      supplierId,
      qty,
      price: offer.price, // ← только цена из offer_price
      basePrice: offer.basePrice, // ← просто прокидываем в БД
      hash: finalHash,
      descr: finalDescr,
      deliveryDays: offer.deliveryDays,
    });

    return mapBasketToResponse(item, offer.qty);
  }

  async removeFromBasket(
    userId: number,
    dto: RemoveBasketItemDto,
  ): Promise<BasketItemResponseDto> {
    await this.ensureUserExists(userId);
    const priceListId = await this.resolvePriceListId(userId);

    const { skuId, supplierId, hash } = dto;

    // берём актуальную цену из текущего прайса
    const offer = await this.repo.getOfferSnapshot(
      skuId,
      supplierId,
      priceListId,
    );
    const updatedOrDeleted = await this.repo.decrementOrDelete(
      { userId, skuId, supplierId, hash },
      offer.price,
      offer.basePrice,
    );

    if (!updatedOrDeleted) throw new NotFoundException("Item not found");
    return mapBasketToResponse(updatedOrDeleted, offer.qty);
  }

  async deleteFromBasket(
    userId: number,
    dto: DeleteBasketItemDto,
  ): Promise<void> {
    await this.ensureUserExists(userId);
    await this.repo.deleteMany({
      userId,
      skuId: dto.skuId,
      supplierId: dto.supplierId,
      hash: dto.hash,
    });
  }

  async clearBasket(userId: number): Promise<void> {
    await this.ensureUserExists(userId);
    await this.repo.deleteMany({ userId });
  }

  async getBasket(userId: number): Promise<BasketItemResponseDto[]> {
    await this.ensureUserExists(userId);
    const priceListId = await this.resolvePriceListId(userId);

    const items = await this.repo.findAll(userId);
    if (!items.length) return [];

    const keys = items.map(({ skuId, supplierId }) => ({ skuId, supplierId }));
    const snapshots = await this.repo.getSnapshots(keys, priceListId);

    return items.map((it) => {
      const snap = snapshots.get(`${it.skuId}-${it.supplierId}`);
      return mapBasketToResponse(it, snap?.qty ?? 0);
    });
  }

  async compareWithServerState(
    userId: number,
    clientItems: CompareBasketItemDto[],
  ): Promise<BasketDiffItem[]> {
    const priceListId = await this.resolvePriceListId(userId);

    const keys = clientItems.map((i) => ({
      skuId: i.skuId,
      supplierId: i.supplierId,
    }));
    const snaps = await this.repo.getSnapshots(keys, priceListId);

    const diffs: BasketDiffItem[] = [];
    for (const item of clientItems) {
      const snap = snaps.get(`${item.skuId}-${item.supplierId}`);
      if (!snap) {
        // нет цены в текущем прайс-листе — позиция для пользователя недоступна
        diffs.push({ ...item });
        continue;
      }

      const clientPrice = Number(item.price);
      const actualPrice = Number(snap.price);
      const newQty = Math.min(item.qty, snap.qty);

      if (clientPrice !== actualPrice || item.qty > snap.qty) {
        diffs.push({
          ...item,
          oldQty: item.qty,
          newQty,
          oldPrice: clientPrice,
          newPrice: actualPrice,
        });
      }
    }
    return diffs;
  }
}
