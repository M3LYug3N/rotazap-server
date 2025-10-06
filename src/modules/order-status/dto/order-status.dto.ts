import { IsString } from "class-validator";

export class CreateOrderStatusDto {
  @IsString()
  name: string;
}
