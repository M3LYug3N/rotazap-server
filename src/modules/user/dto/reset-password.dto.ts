import {
  IsNotEmpty,
  IsOptional,
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

export class ResetPasswordDto {
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
  @IsOptional()
  password: string;
}
