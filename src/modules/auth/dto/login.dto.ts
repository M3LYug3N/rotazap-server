import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import {
  IsNotEmptyField,
  MaxLengthMessage,
  MinLengthMessage,
} from "@/common/error-messages";

export class LoginDto {
  @Transform(({ value }) => value.toLowerCase())
  @IsEmail({}, { message: "Неверный формат email" })
  @IsNotEmpty({ message: IsNotEmptyField })
  email: string;

  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,30}$/,
    {
      message:
        "Пароль должен содержать минимум одну заглавную букву, одну строчную букву, одну цифру и один специальный символ.",
    },
  )
  @MinLength(5, { message: MinLengthMessage(5) })
  @MaxLength(30, { message: MaxLengthMessage(30) })
  @IsNotEmpty({ message: IsNotEmptyField })
  password: string;
}
