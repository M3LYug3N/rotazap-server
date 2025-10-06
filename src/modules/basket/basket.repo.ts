import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@/modules/prisma/prisma.service";

@Injectable()
export class BasketRepo {
  constructor(private readonly prisma: PrismaService) {}

  /** include для SKU (единая точка) */
  readonly skuInclude = {
    sku: {
      select: {
        article: true,
        skuNames: { select: { name: true }, take: 1 },
        brand: { select: { name: true } },
      },
    },
  };

  // priceListId пользователя (дефолт 1)
  async getUserPriceListId(userId: number): Promise<number> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { priceListId: true },
    });
    if (!u) throw new NotFoundException(`User ${userId} not found`);
    return u.priceListId ?? 1;
  }

  /** true — если пользователь существует */
  async userExists(userId: number): Promise<boolean> {
    return (await this.prisma.user.count({ where: { id: userId } })) > 0;
  }

  /** Найти позицию корзины (только qty) */
  findItemQty(where: {
    userId: number;
    skuId: number;
    supplierId: number;
    hash: string;
  }) {
    return this.prisma.basket.findUnique({
      where: { userId_skuId_supplierId_hash: where },
      select: { qty: true },
    });
  }

  /** Upsert позиции корзины */
  upsertItem(data: {
    userId: number;
    skuId: number;
    supplierId: number;
    qty: number;
    price: number;
    basePrice: number;
    hash: string;
    descr: string;
    deliveryDays: number | null;
  }) {
    const { userId, skuId, supplierId, hash, ...rest } = data;
    return this.prisma.basket.upsert({
      where: {
        userId_skuId_supplierId_hash: { userId, skuId, supplierId, hash },
      },
      create: { userId, skuId, supplierId, hash, ...rest },
      update: { ...rest, qty: { increment: rest.qty } },
      include: this.skuInclude,
    });
  }

  /** Уменьшить qty или удалить позицию */
  async decrementOrDelete(
    where: { userId: number; skuId: number; supplierId: number; hash: string },
    price: number,
    basePrice: number,
  ) {
    const found = await this.prisma.basket.findUnique({
      where: { userId_skuId_supplierId_hash: where },
      select: { qty: true },
    });
    if (!found) return null;

    if (found.qty > 1) {
      return this.prisma.basket.update({
        where: { userId_skuId_supplierId_hash: where },
        data: { qty: { decrement: 1 }, price, basePrice },
        include: this.skuInclude,
      });
    }
    return this.prisma.basket.delete({
      where: { userId_skuId_supplierId_hash: where },
      include: this.skuInclude,
    });
  }

  /** Удалить несколько позиций */
  deleteMany(where: {
    userId: number;
    skuId?: number;
    supplierId?: number;
    hash?: string;
  }) {
    return this.prisma.basket.deleteMany({ where });
  }

  /** Получить все позиции корзины пользователя */
  findAll(userId: number) {
    return this.prisma.basket.findMany({
      where: { userId },
      include: this.skuInclude,
    });
  }

  /** Короткая инфа по SKU (для описания) */
  async getSkuBrief(skuId: number) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      select: {
        article: true,
        brand: { select: { name: true } },
        skuNames: { select: { name: true }, take: 1 },
      },
    });
    if (!sku) throw new NotFoundException("SKU не найден");
    return sku;
  }

  /** Снапшот оффера (цены/остатки/доставка) */
  async getOfferSnapshot(
    skuId: number,
    supplierId: number,
    priceListId: number,
  ): Promise<{
    price: number;
    basePrice: number;
    qty: number;
    deliveryDays: number | null;
  }> {
    const [priceRow, supplierRow] = await Promise.all([
      this.prisma.offerPrice.findUnique({
        where: {
          priceListId_supplierId_skuId: { priceListId, supplierId, skuId },
        },
        select: { price: true },
      }),
      this.prisma.suppliersOffers.findFirst({
        where: { skuId, supplierId },
        select: {
          basePrice: true,
          qty: true,
          supplier: { select: { deliveryDays: true } },
        },
      }),
    ]);

    if (!supplierRow) {
      throw new NotFoundException(`Offer ${skuId}/${supplierId} not found`);
    }
    if (!priceRow) {
      // Нет цены для текущего прайса — оффер для этого юзера недоступен
      throw new NotFoundException(
        `No price for ${skuId}/${supplierId} in priceList ${priceListId}`,
      );
    }

    return {
      price: priceRow.price, // ТОЛЬКО offer_price
      basePrice: supplierRow.basePrice, // Просто прокидываем
      qty: supplierRow.qty,
      deliveryDays: supplierRow.supplier?.deliveryDays ?? null,
    };
  }

  /** Массовые снапшоты (для корзины/сравнения) */
  async getSnapshots(
    keys: Array<{ skuId: number; supplierId: number }>,
    priceListId: number,
  ): Promise<
    Map<
      string,
      {
        price: number;
        basePrice: number;
        qty: number;
        deliveryDays: number | null;
      }
    >
  > {
    const skuIds = [...new Set(keys.map((k) => k.skuId))];
    const supplierIds = [...new Set(keys.map((k) => k.supplierId))];

    const [priceRows, offerRows] = await Promise.all([
      this.prisma.offerPrice.findMany({
        where: {
          priceListId, // ← фильтрация по прайсу
          skuId: { in: skuIds },
          supplierId: { in: supplierIds },
        },
        select: { skuId: true, supplierId: true, price: true },
      }),
      this.prisma.suppliersOffers.findMany({
        where: { skuId: { in: skuIds }, supplierId: { in: supplierIds } },
        select: {
          skuId: true,
          supplierId: true,
          basePrice: true,
          qty: true,
          supplier: { select: { deliveryDays: true } },
        },
      }),
    ]);

    const priceKey = (s: number, sup: number) => `${s}-${sup}`;
    const priceMap = new Map(
      priceRows.map((r) => [priceKey(r.skuId, r.supplierId), r.price]),
    );

    const result = new Map<
      string,
      {
        price: number;
        basePrice: number;
        qty: number;
        deliveryDays: number | null;
      }
    >();

    for (const o of offerRows) {
      const key = priceKey(o.skuId, o.supplierId);
      const price = priceMap.get(key);
      if (price == null) continue; // ← НЕТ цены для текущего прайса — пропускаем

      result.set(key, {
        price, // без фолбэка
        basePrice: o.basePrice,
        qty: o.qty,
        deliveryDays: o.supplier?.deliveryDays ?? null,
      });
    }
    return result;
  }
}
