import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class AddBasketItemDto {
  @IsInt()
  skuId: number;

  @IsInt()
  supplierId: number;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsString()
  descr: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;
}
