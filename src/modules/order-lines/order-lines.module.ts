import { Module } from "@nestjs/common";

import { PrismaService } from "@/modules/prisma/prisma.service";

import { OrderLinesController } from "./order-lines.controller";
import { OrderLinesService } from "./order-lines.service";

@Module({
  controllers: [OrderLinesController],
  providers: [OrderLinesService, PrismaService],
})
export class OrderLinesModule {}
