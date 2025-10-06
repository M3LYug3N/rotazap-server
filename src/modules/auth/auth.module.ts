import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { EmailService } from "@/modules/email/email.service";
import { PrismaService } from "@/modules/prisma/prisma.service";

import { getJwtConfig } from "@/config/jwt.config";

import { JwtStrategy } from "@/strategy/jwt.strategy";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService, EmailService],
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
