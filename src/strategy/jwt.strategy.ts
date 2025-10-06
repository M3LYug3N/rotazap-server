import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { Strategy } from "passport-jwt";

import { PrismaService } from "@/modules/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        // Чтение токена из куки
        const token = req.cookies?.accessToken;
        if (!token) {
          throw new UnauthorizedException("Токен доступа отсутствует");
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }

  async validate(payload: { id: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }
    return user;
  }
}
