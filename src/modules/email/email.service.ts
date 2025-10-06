import { BadRequestException, Injectable } from "@nestjs/common";
import * as dns from "dns/promises";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import juice from "juice";
import * as nodemailer from "nodemailer";
import * as path from "path";

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from = process.env.EMAIL_FROM;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      logger: true,
      debug: true,
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.isValidEmail(to)) {
      throw new BadRequestException(`Некорректный email: ${to}`);
    }

    if (!(await this.isDomainValid(to))) {
      throw new BadRequestException(`Почтовый домен ${to} не найден.`);
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      console.log(`📬 Email отправлен на ${to}`);
    } catch (error) {
      console.error("❌ Ошибка при отправке письма:", error.message);
      throw new BadRequestException(`Ошибка отправки: ${error.message}`);
    }
  }

  private renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    const filePath = path.resolve(
      process.cwd(),
      "src",
      "modules",
      "email",
      "templates",
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Шаблон "${templateName}" не найден`);
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const compiled = Handlebars.compile(raw);
    const html = compiled(context);

    return juice(html); // инлайним стили
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async isDomainValid(email: string): Promise<boolean> {
    try {
      const domain = email.split("@")[1];
      const mx = await dns.resolveMx(domain);
      return mx.length > 0;
    } catch {
      return false;
    }
  }

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    await this.sendTemplate("welcome", to, "Добро пожаловать в rotazap.ru", {
      username,
      email: to,
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    await this.sendTemplate("reset-password", to, "Восстановление пароля", {
      resetLink,
      email: to,
    });
  }

  async sendPasswordResetSuccessEmail(to: string): Promise<void> {
    await this.sendTemplate(
      "reset-password-success",
      to,
      "Пароль успешно восстановлен",
      {
        email: to,
      },
    );
  }

  async sendProfileUpdateEmail(to: string, changesHtml: string): Promise<void> {
    await this.sendTemplate("profile-update", to, "Обновление данных профиля", {
      changes: changesHtml,
    });
  }

  private async sendTemplate(
    template: string,
    to: string,
    subject: string,
    context: Record<string, any>,
  ): Promise<void> {
    const html = this.renderTemplate(template, context);
    await this.sendMail(to, subject, html);
  }
}
