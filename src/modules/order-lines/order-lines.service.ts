import { Injectable, NotFoundException } from "@nestjs/common";

import { UpdateOrderLineDto } from "@/modules/order-lines/dto/update-order-line.dto";
import { PrismaService } from "@/modules/prisma/prisma.service";

import { CreateOrderLineDto } from "./dto/create-order-line.dto";

@Injectable()
export class OrderLinesService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderLineDto: CreateOrderLineDto) {
    const { orderId, skuId, supplierId, qty, price, basePrice } =
      createOrderLineDto;

    return this.prisma.$transaction(async (tx) => {
      const orderLine = await tx.orderLines.create({
        data: {
          orderId,
          skuId,
          supplierId,
          qty,
          price,
          basePrice,
        },
      });

      await tx.orderLinesStatus.create({
        data: {
          orderLineId: orderLine.id,
          orderStatusId: 6, // "Новый заказ"
          qty,
          createdAt: new Date(),
        },
      });

      return orderLine;
    });
  }

  async findAll() {
    return this.prisma.orderLines.findMany({
      include: {
        order: true,
        sku: true,
        supplier: true,
      },
    });
  }

  async findOne(id: number) {
    const orderLine = await this.prisma.orderLines.findUnique({
      where: { id },
      include: {
        order: true,
        sku: true,
        supplier: true,
      },
    });

    if (!orderLine) {
      throw new NotFoundException(`OrderLine with id ${id} not found`);
    }

    return orderLine;
  }

  async update(id: number, updateOrderLineDto: UpdateOrderLineDto) {
    return this.prisma.orderLines.update({
      where: { id },
      data: updateOrderLineDto,
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    // Проверяем, существует ли запись с данным id
    const orderLine = await this.prisma.orderLines.findUnique({
      where: { id },
    });

    // Если запись не найдена, возвращаем сообщение
    if (!orderLine) {
      return { message: `Order line with id ${id} does not exist.` };
    }

    // Если запись найдена, удаляем её
    await this.prisma.orderLines.delete({
      where: { id },
    });

    return { message: `Order line with id ${id} was successfully deleted.` };
  }
}
