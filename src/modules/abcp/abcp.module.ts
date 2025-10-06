import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AbcpController } from "@/modules/abcp/abcp.controller";
import { AbcpService } from "@/modules/abcp/abcp.service";
import { PrismaModule } from "@/modules/prisma/prisma.module";

import abcpConfig from "@/config/abcp.config";

@Module({
  imports: [PrismaModule, ConfigModule.forFeature(abcpConfig)],
  controllers: [AbcpController],
  providers: [AbcpService],
  exports: [AbcpService],
})
export class AbcpModule {}
