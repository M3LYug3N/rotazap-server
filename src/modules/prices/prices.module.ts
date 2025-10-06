import { Module } from "@nestjs/common";

import { PricesController } from "@/modules/prices/prices.controller";

import { PricesService } from "./prices.service";

@Module({
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
