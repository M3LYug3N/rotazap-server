import { Module } from "@nestjs/common";

import { PrismaService } from "@/modules/prisma/prisma.service";

import { SocketGateway } from "./socket.gateway";

@Module({
  providers: [SocketGateway, PrismaService],
  exports: [SocketGateway],
})
export class SocketModule {}
