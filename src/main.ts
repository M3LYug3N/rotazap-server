import { BadRequestException, Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import cookieParser from "cookie-parser";
import * as express from "express";

import { AppModule } from "@/modules/app/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  app.enableCors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://rotazap.ru", "https://www.rotazap.ru"]
        : ["http://localhost:3000"],
    credentials: true,
  });
  app.use(cookieParser());
  app.use(express.json());
  app.use((req, res, next) => {
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // 👈 КРИТИЧЕСКИ ВАЖНО
      },
      whitelist: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        console.log("❌ Validation errors:", errors);
        return new BadRequestException(
          errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        );
      },
    }),
  );
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(5000);
  Logger.log("Application is running on: " + (await app.getUrl()));
}
bootstrap();
