import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AbcpModule } from "@/modules/abcp/abcp.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { BasketModule } from "@/modules/basket/basket.module";
import { DocumentsModule } from "@/modules/documents/document.module";
import { DevController } from "@/modules/email/dev.controller";
import { OrderLinesStatusModule } from "@/modules/order-lines-status/order-lines-status.module";
import { OrderLinesModule } from "@/modules/order-lines/order-lines.module";
import { OrderStatusModule } from "@/modules/order-status/order-status.module";
import { OrdersModule } from "@/modules/orders/orders.module";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { SocketModule } from "@/modules/socket/socket.module";
import { UserModule } from "@/modules/user/user.module";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    AbcpModule,
    BasketModule,
    OrdersModule,
    OrderLinesModule,
    OrderStatusModule,
    OrderLinesStatusModule,
    DocumentsModule,
    SocketModule,
  ],
  controllers: [AppController, DevController],
  providers: [AppService],
})
export class AppModule {}
