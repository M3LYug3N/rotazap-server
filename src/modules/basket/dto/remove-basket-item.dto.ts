import { IsInt, IsString } from "class-validator";

/**
 * DTO для удаления одной единицы товара из корзины.
 */
export class RemoveBasketItemDto {
  @IsInt()
  skuId: number;

  @IsInt()
  supplierId: number;

  @IsString()
  hash: string;
}
