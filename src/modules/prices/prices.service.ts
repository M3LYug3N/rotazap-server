import { Injectable } from "@nestjs/common";

@Injectable()
export class PricesService {
  async findInPriceList(brand: string, number: string): Promise<any> {
    // TODO: Реализовать логику поиска в базе данных или прайс-листе
    return [];
  }
}
