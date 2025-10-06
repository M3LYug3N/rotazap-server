import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";

import { LoginDto } from "@/modules/auth/dto/login.dto";
import { RefreshTokenDto } from "@/modules/auth/dto/refresh-token.dto";
import { RegisterDto } from "@/modules/auth/dto/register.dto";
import { EmailService } from "@/modules/email/email.service";
import { PrismaService } from "@/modules/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existsUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existsUser) {
      const conflictFields = [];
      if (existsUser.email === dto.email) conflictFields.push("email");
      if (existsUser.username === dto.username) conflictFields.push("username");

      throw new ConflictException(
        `Пользователь с таким ${conflictFields.join(" / ")} уже существует`,
      );
    }

    // Выполняем транзакцию
    return this.prisma.$transaction(async (transactionPrisma) => {
      const user = await transactionPrisma.user.create({
        data: {
          email: dto.email.toLocaleLowerCase(),
          username: dto.username,
          password: await hash(dto.password),
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          address: dto.address,
          organizationName: dto.organizationName,
          activity: dto.activity,
          legalForm: dto.legalForm,
          role: "pending",
        },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phoneNumber: true,
          role: true,
        },
      });

      // Отправка email

      try {
        await this.email.sendWelcomeEmail(dto.email, dto.username);
      } catch (error) {
        console.error("Ошибка при отправке email:", error.message);
        throw new BadRequestException(
          `Не удалось отправить письмо на ${dto.email}. Проверьте корректность адреса.`,
        );
      }

      // Генерация токенов после успешной отправки письма
      const tokens = await this.generateTokens(user.id);

      await transactionPrisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return { user, ...tokens };
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        address: true,
      },
    });

    if (!user || !(await verify(user.password, dto.password))) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const tokens = await this.generateTokens(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
      ...tokens,
    };
  }

  async getNewTokens(dto: RefreshTokenDto) {
    const result = await this.jwt.verifyAsync(dto.refreshToken);

    if (!result) {
      throw new UnauthorizedException("Неверный токен");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: result.id },
    });

    if (!user || user.refreshToken !== dto.refreshToken) {
      throw new UnauthorizedException("Неверный токен");
    }

    const tokens = await this.generateTokens(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      ...tokens,
    };
  }

  async getUserById(userId: number) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        email: true,
        username: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        legalForm: true,
        activity: true,
        organizationName: true,
        priceListId: true,
        role: true,
        avatarPath: true,
      },
    });
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async generateTokens(userId: number) {
    const data = { id: userId };
    const accessToken = this.jwt.sign(data, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m",
    });
    const refreshToken = this.jwt.sign(data, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d",
    });

    return { accessToken, refreshToken };
  }

  public async createTokensForUser(userId: number) {
    return this.generateTokens(userId);
  }
}
