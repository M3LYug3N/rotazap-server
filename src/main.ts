import { BadRequestException, Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import cookieParser from "cookie-parser";
import * as express from "express";

import { AppModule } from "@/modules/app/app.module";

// Утилита: парсинг списков доменов из ENV
const parseOrigins = (s?: string | null) =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

async function bootstrap() {
  const PORT = Number(process.env.PORT ?? 5000);
  const HOST = process.env.HOST ?? "0.0.0.0";
  const isProd = process.env.NODE_ENV === "production";

  const app = await NestFactory.create(AppModule, { bodyParser: true });

  app.setGlobalPrefix("api");
  app.enableShutdownHooks();

  // Доверяем прокси (Express): через адаптер
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === "express") {
    const instance = httpAdapter.getInstance(); // это Express app
    instance.set("trust proxy", 1);
  }

  // CORS
  const origins =
    parseOrigins(process.env.CLIENT_ORIGINS).length > 0
      ? parseOrigins(process.env.CLIENT_ORIGINS)
      : isProd
        ? ["https://rotazap.ru", "https://www.rotazap.ru"]
        : ["http://localhost:3000"];

  app.enableCors({ origin: origins, credentials: true });

  app.use(cookieParser());
  app.use(express.json());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        console.log("❌ Validation errors:", errors);
        return new BadRequestException(
          errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        );
      },
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  // Health: GET /api/health → 200
  httpAdapter.getInstance().get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  await app.listen(PORT, HOST);
  Logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
