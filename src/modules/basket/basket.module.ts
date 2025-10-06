import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AbcpService } from "@/modules/abcp/abcp.service";
import { BasketRepo } from "@/modules/basket/basket.repo";
import { PrismaService } from "@/modules/prisma/prisma.service";

import abcpConfig from "@/config/abcp.config";

import { BasketController } from "./basket.controller";
import { BasketService } from "./basket.service";

@Module({
  imports: [ConfigModule.forFeature(abcpConfig)],
  controllers: [BasketController],
  providers: [BasketService, PrismaService, AbcpService, BasketRepo],
  exports: [BasketService],
})
export class BasketModule {}
