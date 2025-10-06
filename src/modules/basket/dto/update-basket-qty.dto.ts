import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateBasketQtyDto {
  @IsInt()
  readonly skuId: number;

  @IsInt()
  readonly supplierId: number;

  @IsInt()
  readonly qty: number;

  @IsString()
  @IsOptional()
  readonly hash?: string;
}
