import { Injectable, NotFoundException } from "@nestjs/common";

import { CreateOrderStatusDto } from "@/modules/order-status/dto/order-status.dto";
import { PrismaService } from "@/modules/prisma/prisma.service";

@Injectable()
export class OrderStatusService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderStatusDto: CreateOrderStatusDto) {
    return this.prisma.orderStatus.create({
      data: {
        name: createOrderStatusDto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.orderStatus.findMany();
  }

  async findOne(id: number) {
    const status = await this.prisma.orderStatus.findUnique({
      where: { id },
    });
    if (!status) {
      throw new NotFoundException(`Order status with id ${id} not found`);
    }
    return status;
  }
}
