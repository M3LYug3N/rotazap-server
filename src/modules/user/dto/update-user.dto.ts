import {
  IsEmail,
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

export class UpdateUserDto {
  @IsEmail({}, { message: "Неверный формат email" })
  @IsNotEmpty({ message: IsNotEmptyField })
  email: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9\s]*$/, {
    message: "Username может содержать только латинские буквы, и цифры",
  })
  @MinLength(5, { message: MinLengthMessage(5) })
  @MaxLength(30, { message: MaxLengthMessage(30) })
  @IsNotEmpty({ message: IsNotEmptyField })
  @IsOptional()
  username: string;

  @IsString()
  @Matches(/^\+7-\d{3}-\d{3}-\d{2}-\d{2}$/, {
    message: "Номер телефона должен быть в формате +7-___-___-__-__",
  })
  @IsNotEmpty({ message: IsNotEmptyField })
  phoneNumber: string;

  @IsString()
  @Matches(/^[а-яА-ЯёЁ\s]*$/, {
    message: "FullName может содержать только кириллические буквы",
  })
  @MinLength(5, { message: MinLengthMessage(5) })
  @MaxLength(30, { message: MaxLengthMessage(30) })
  @IsNotEmpty({ message: IsNotEmptyField })
  fullName: string;
}
