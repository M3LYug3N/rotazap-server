import { Controller, Get, Query } from "@nestjs/common";

import { PricesService } from "@/modules/prices/prices.service";

@Controller("prices")
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get("find")
  async findInPriceList(
    @Query("brand") brand: string,
    @Query("number") number: string,
  ) {
    return this.pricesService.findInPriceList(brand, number);
  }
}
