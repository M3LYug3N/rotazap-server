import { Module } from "@nestjs/common";

import { AuthModule } from "@/modules/auth/auth.module";
import { EmailService } from "@/modules/email/email.service";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { SocketModule } from "@/modules/socket/socket.module";

import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [SocketModule, AuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, EmailService],
})
export class UserModule {}
