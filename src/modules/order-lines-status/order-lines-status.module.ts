import { Module } from "@nestjs/common";

import { OrderLinesStatusController } from "@/modules/order-lines-status/order-lines-status.controller";
import { OrderLinesStatusService } from "@/modules/order-lines-status/order-lines-status.service";
import { PrismaService } from "@/modules/prisma/prisma.service";

@Module({
  controllers: [OrderLinesStatusController],
  providers: [OrderLinesStatusService, PrismaService],
})
export class OrderLinesStatusModule {}
