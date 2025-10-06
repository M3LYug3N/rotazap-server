import { IsNotEmpty, IsString } from "class-validator";

export class SearchBrandsDto {
  @IsString()
  @IsNotEmpty()
  number: string;
}
