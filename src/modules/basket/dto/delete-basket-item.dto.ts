import { IsInt, IsString, Min } from "class-validator";

/**
 * DTO для полного удаления позиции из корзины.
 * SKU и поставщик обязательны.
 */
export class DeleteBasketItemDto {
  @IsInt()
  @Min(1)
  skuId: number;

  @IsInt()
  supplierId: number;

  @IsString()
  hash: string;
}
