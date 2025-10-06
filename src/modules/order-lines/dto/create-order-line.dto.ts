import { IsInt, IsNumber } from "class-validator";

export class CreateOrderLineDto {
  @IsInt()
  orderId: number;

  @IsInt()
  skuId: number;

  @IsInt()
  supplierId: number;

  @IsInt()
  qty: number;

  @IsNumber()
  price: number;

  @IsNumber()
  basePrice: number;
}
