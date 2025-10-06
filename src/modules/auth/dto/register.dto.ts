import {
  IsEmail,
  IsEnum,
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

enum LegalForm {
  INDIVIDUAL = "Индивидуальный предприниматель",
  COMPANY = "Юридическое лицо",
}

enum Activity {
  ONLINE_STORE = "Интернет-магазин",
  SERVICE_STATION = "СТО",
  RETAIL_STORE = "Розничный магазин",
  OTHER = "Другое",
}

export class RegisterDto {
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

  @IsString()
  @Matches(/^[a-zA-Z0-9\s]*$/, {
    message: "Username может содержать только латинские буквы, и цифры",
  })
  @MinLength(5, { message: MinLengthMessage(5) })
  @MaxLength(30, { message: MaxLengthMessage(30) })
  @IsNotEmpty({ message: IsNotEmptyField })
  username: string;

  @IsString()
  @Matches(/^[а-яА-ЯёЁ\s]*$/, {
    message: "FullName может содержать только кириллические буквы",
  })
  @MinLength(5, { message: MinLengthMessage(5) })
  @MaxLength(30, { message: MaxLengthMessage(30) })
  @IsNotEmpty({ message: IsNotEmptyField })
  fullName: string;

  @IsString()
  @Matches(/^\+7-\d{3}-\d{3}-\d{2}-\d{2}$/, {
    message: "Номер телефона должен быть в формате +7-___-___-__-__",
  })
  @IsNotEmpty({ message: IsNotEmptyField })
  phoneNumber: string;

  @IsString()
  @Matches(/^[а-яА-ЯёЁ0-9\s.,-/]*$/, {
    message: "Address может содержать только кириллические буквы, и цифры",
  })
  @MinLength(5, { message: MinLengthMessage(5) })
  @MaxLength(100, { message: "Не более 100 символов" })
  @IsNotEmpty({ message: IsNotEmptyField })
  address: string;

  @IsString()
  @Matches(/^[a-zA-Zа-яА-Я0-9\-.,\\|/@'"\[\](){}<>$%^&*_+=\s]*$/, {
    message: "Неверное значение",
  })
  @MinLength(5, { message: MinLengthMessage(5) })
  @MaxLength(30, { message: MaxLengthMessage(30) })
  @IsNotEmpty({ message: IsNotEmptyField })
  organizationName: string;

  @IsEnum(LegalForm, { message: "Неверное значение" })
  legalForm: LegalForm;

  @IsEnum(Activity, { message: "Неверное значение" })
  activity: Activity;
}
