import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { User } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import * as fs from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CurrentUser } from "@/modules/auth/decorators/user.decorator";
import { UploadDocumentDto } from "@/modules/documents/dto/upload-document.dto";

import { DocumentsService } from "./documents.service";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Auth()
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const userId = (req.user as User)?.id ?? "anonymous";
          const folder = join(
            __dirname,
            "..",
            "..",
            "..",
            "uploads",
            "constitution",
            String(userId),
          );
          fs.mkdirSync(folder, { recursive: true });
          cb(null, folder);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e6,
          )}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser("id") userId: number,
  ) {
    // ✅ validate DTO manually
    const dto = plainToInstance(UploadDocumentDto, body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(
        errors.map((e) => ({
          field: e.property,
          constraints: e.constraints,
        })),
      );
    }

    // ✅ validate file
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!file) {
      throw new BadRequestException("Файл обязателен");
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("Недопустимый формат файла");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException("Файл должен быть не больше 10 МБ");
    }

    return this.documentsService.saveDocument(file, dto.documentType, userId);
  }
}
