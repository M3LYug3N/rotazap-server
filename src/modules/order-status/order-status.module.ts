import { Module } from "@nestjs/common";

import { PrismaService } from "@/modules/prisma/prisma.service";

import { OrderStatusController } from "./order-status.controller";
import { OrderStatusService } from "./order-status.service";

@Module({
  controllers: [OrderStatusController],
  providers: [OrderStatusService, PrismaService],
})
export class OrderStatusModule {}
