import { IsDate, IsInt } from "class-validator";

export class CreateOrderLinesStatusDto {
  @IsInt()
  orderLineId: number;

  @IsInt()
  orderStatusId: number;

  @IsInt()
  qty: number;

  @IsDate()
  createdAt?: Date;
}
