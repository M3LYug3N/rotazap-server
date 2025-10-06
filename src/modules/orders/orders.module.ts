import { Module } from "@nestjs/common";

import { OrdersController } from "@/modules/orders/orders.controller";
import { OrdersService } from "@/modules/orders/orders.service";
import { PrismaService } from "@/modules/prisma/prisma.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
