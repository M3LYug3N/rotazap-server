import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class OrderItemDto {
  @Type(() => Number)
  @IsInt()
  skuId: number;

  @Type(() => Number)
  @IsInt()
  supplierId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty: number;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @Type(() => Number)
  @IsNumber()
  basePrice: number;

  @Type(() => String)
  @IsString()
  descr: string;

  @IsString()
  @IsOptional()
  hash?: string;

  @IsInt()
  @IsOptional()
  deliveryDays?: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto) // ✅ обязательно, чтобы сработал transform
  items: OrderItemDto[];
}
