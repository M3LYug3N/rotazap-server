import { IsInt, IsNumber, IsString } from "class-validator";

/**
 * DTO, возвращаемое при работе с корзиной.
 * Содержит все данные о товаре, добавленном в корзину.
 */
export class BasketItemResponseDto {
  @IsInt()
  skuId: number;

  @IsInt()
  supplierId: number;

  @IsString()
  brand: string;

  @IsString()
  article: string;

  @IsString()
  descr: string;

  @IsNumber()
  price: number;

  @IsNumber()
  basePrice: number;

  @IsInt()
  qty: number;

  @IsString()
  hash: string;

  @IsInt()
  availableQty: number;

  @IsInt()
  deliveryDays: number;
}
