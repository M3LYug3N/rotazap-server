import { Injectable } from "@nestjs/common";
import { join } from "path";

@Injectable()
export class DocumentsService {
  async saveDocument(
    file: Express.Multer.File,
    documentType: string,
    userId: number | string,
  ) {
    return {
      message: "Документ успешно загружен",
      documentType,
      userId,
      file: {
        originalName: file.originalname,
        savedName: file.filename,
        relativePath: join(
          "uploads/constitution",
          String(userId),
          file.filename,
        ),
        absolutePath: file.path,
        size: file.size,
        mimeType: file.mimetype,
      },
    };
  }
}
