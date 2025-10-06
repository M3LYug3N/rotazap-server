import { BadRequestException, Injectable } from "@nestjs/common";

import { OrderResponseDto } from "@/modules/orders/dto/order-response.dto";
import { PrismaService } from "@/modules/prisma/prisma.service";

import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateOrderBeforeCreation(dto: CreateOrderDto): Promise<void> {
    if (!dto.items.length) {
      throw new BadRequestException("Пустой заказ");
    }

    const keys = dto.items.map((i) => ({
      skuId: i.skuId,
      supplierId: i.supplierId,
    }));

    const [offers, offerPrices] = await this.prisma.$transaction([
      this.prisma.suppliersOffers.findMany({ where: { OR: keys } }),
      this.prisma.offerPrice.findMany({ where: { OR: keys } }),
    ]);

    const offerMap = new Map(
      offers.map((o) => [`${o.skuId}-${o.supplierId}`, o]),
    );

    const errors: string[] = [];

    for (const item of dto.items) {
      const key = `${item.skuId}-${item.supplierId}`;
      const offer = offerMap.get(key);

      if (!offer) {
        errors.push(
          `Позиция ${item.skuId} от поставщика ${item.supplierId} не найдена`,
        );
        continue;
      }

      if (offer.qty < item.qty) {
        errors.push(
          `Недостаточно остатков для SKU ${item.skuId}: нужно ${item.qty}, доступно ${offer.qty}`,
        );
      }

      const matched = offerPrices.find(
        (p) =>
          p.skuId === item.skuId &&
          p.supplierId === item.supplierId &&
          Number(p.price) === Number(item.price),
      );

      if (!matched) {
        const availablePrices = offerPrices
          .filter(
            (p) => p.skuId === item.skuId && p.supplierId === item.supplierId,
          )
          .map((p) => p.price)
          .join(", ");

        errors.push(
          `Цена изменилась на SKU ${item.skuId}: было ${item.price}, доступные: ${availablePrices}`,
        );
      }
    }

    if (errors.length) {
      throw new BadRequestException(errors.join("; "));
    }
  }

  async createOrder(userId: number, dto: CreateOrderDto) {
    const [supplierOffers, offerPrices] = await this.prisma.$transaction([
      this.prisma.suppliersOffers.findMany({
        where: {
          OR: dto.items.map((i) => ({
            skuId: i.skuId,
            supplierId: i.supplierId,
          })),
        },
        include: {
          supplier: {
            select: { deliveryDays: true },
          },
        },
      }),
      this.prisma.offerPrice.findMany({
        where: {
          OR: dto.items.map((i) => ({
            skuId: i.skuId,
            supplierId: i.supplierId,
          })),
        },
      }),
    ]);

    const baseMap = new Map(
      supplierOffers.map((o) => [`${o.skuId}-${o.supplierId}`, o]),
    );

    const [order] = await this.prisma.$transaction([
      this.prisma.orders.create({
        data: {
          userId,
          orderLines: {
            create: dto.items.map((item) => {
              const key = `${item.skuId}-${item.supplierId}`;
              const supplier = baseMap.get(key)!;

              return {
                skuId: item.skuId,
                supplierId: item.supplierId,
                qty: item.qty,
                descr: item.descr,
                price: item.price,
                basePrice: supplier.basePrice,
                deliveryDays: supplier.supplier?.deliveryDays ?? null,
                orderLineStatus: {
                  create: {
                    // Устанавливаем статус "Новый заказ"
                    orderStatusId: 1,
                    qty: item.qty,
                  },
                },
              };
            }),
          },
        },
      }),

      ...dto.items.map((item) =>
        this.prisma.suppliersOffers.updateMany({
          where: {
            skuId: item.skuId,
            supplierId: item.supplierId,
          },
          data: {
            qty: {
              decrement: item.qty,
            },
          },
        }),
      ),

      this.prisma.basket.deleteMany({
        where: {
          userId,
          OR: dto.items.map((item) => ({
            skuId: item.skuId,
            supplierId: item.supplierId,
            hash: item.hash,
          })),
        },
      }),
    ]);

    return { id: order.id };
  }

  async getUserOrders(userId: number): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.orders.findMany({
      where: { userId },
      include: {
        orderLines: {
          include: {
            sku: {
              select: {
                article: true,
                brand: { select: { name: true } },
              },
            },
            orderLineStatus: {
              include: {
                orderStatus: { select: { name: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: `#RZ-${String(order.userId).padStart(4, "0")}-${order.id}`,
      createdAt: order.createdAt,
      items: order.orderLines.map((line) => ({
        orderLineId: line.id,
        skuId: line.skuId,
        supplierId: line.supplierId,
        article: line.sku.article,
        brand: line.sku.brand.name,
        descr: line.descr,
        qty: line.qty,
        price: line.price,
        basePrice: line.basePrice,
        statuses: line.orderLineStatus.map((status) => ({
          id: status.orderStatusId,
          status: status.orderStatus.name,
          qty: status.qty,
          createdAt: status.createdAt,
        })),
      })),
    }));
  }
}
