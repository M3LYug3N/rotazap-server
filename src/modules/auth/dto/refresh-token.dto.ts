import { IsString } from "class-validator";

export class RefreshTokenDto {
  @IsString({ message: "refreshToken must be a string" })
  refreshToken: string;
}
