import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash, verify } from "argon2";
import { randomBytes } from "crypto";

import { AuthService } from "@/modules/auth/auth.service";
import { EmailService } from "@/modules/email/email.service";
import { PrismaService } from "@/modules/prisma/prisma.service";
import { SocketGateway } from "@/modules/socket/socket.gateway";
import { UpdateUserDto } from "@/modules/user/dto/update-user.dto";

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private socket: SocketGateway,
    private auth: AuthService,
    private email: EmailService,
  ) {}

  /* Хэлпер */
  private getChangedFieldsHtml(
    original: Partial<UpdateUserDto>,
    updated: UpdateUserDto,
  ): string {
    const fieldLabels: Record<keyof UpdateUserDto, string> = {
      username: "Имя пользователя",
      fullName: "Ф.И.О.",
      phoneNumber: "Телефон",
      email: "Email", // можно удалить, если email нельзя редактировать
    };

    const normalize = (val: string | null | undefined) =>
      (val ?? "").replace(/\s+/g, "").trim();

    return Object.entries(updated)
      .filter(([key, newValue]) => {
        if (!(key in fieldLabels)) return false;
        const oldValue = original[key];
        return normalize(newValue) !== normalize(oldValue);
      })
      .map(
        ([key, value]) =>
          `<p><strong>${fieldLabels[key]}:</strong> ${value}</p>`,
      )
      .join("");
  }

  // Обновление роли
  async updateRole(userId: number, role: string) {
    const validRoles = ["user", "admin", "pending"]; // Пример набора ролей
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Роль "${role}" не существует.`);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        avatarPath: true,
      },
    });

    const tokens = await this.auth.createTokensForUser(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: tokens.refreshToken },
    });

    try {
      this.socket.notifyRoleUpdate(userId, role);
    } catch (error) {
      console.error("Ошибка отправки уведомления о роли:", error.message);
    }

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // Получение пользователя по id
  async byId(id: number, selectObject: Prisma.UserSelect = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        ...selectObject,
        baskets: true, // Включаем корзину пользователя
        orders: {
          include: this.getOrderInclude(), // Включаем заказы и их строки
        },
      },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");
    return user;
  }

  // Обновление профиля пользователя
  async updateProfile(id: number, dto: UpdateUserDto) {
    const selectFields = {
      username: true,
      fullName: true,
      phoneNumber: true,
      email: true,
    };

    // Проверка уникальности email (если email разрешён к редактированию)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.id !== id) {
      throw new ConflictException(
        "Email уже используется другим пользователем",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const userBeforeUpdate = await tx.user.findUnique({
        where: { id },
        select: selectFields,
      });

      const updatedUser = await tx.user.update({
        where: { id },
        data: dto,
        select: {
          ...selectFields,
          id: true,
          avatarPath: true,
        },
      });

      const changesHtml = this.getChangedFieldsHtml(userBeforeUpdate, dto);

      if (changesHtml) {
        try {
          await this.email.sendProfileUpdateEmail(
            userBeforeUpdate.email,
            changesHtml,
          );
        } catch (error) {
          console.error("Ошибка отправки письма:", error.message);
          throw new BadRequestException(
            `Не удалось отправить уведомление на ${dto.email}. Проверьте корректность email.`,
          );
        }
      }

      return updatedUser;
    });
  }

  // Генерация ссылки для восстановления пароля
  async initiatePasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Токен на 15 минут

    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt },
      create: { userId: user.id, token, expiresAt },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.email.sendPasswordResetEmail(user.email, resetLink);

    return {
      message: "Ссылка для восстановления пароля отправлена на email",
    };
  }

  // Сохранение нового пароля после валидации токена
  async resetPassword(token: string, newPassword: string) {
    const tokenEntry = await this.prisma.passwordResetToken.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });

    if (!tokenEntry)
      throw new BadRequestException("Недействительный или истекший токен");

    const hashedPassword = await hash(newPassword);

    await this.prisma.user.update({
      where: { id: tokenEntry.userId },
      data: { password: hashedPassword },
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: tokenEntry.id },
    });

    console.log(
      `Пароль пользователя с ID ${tokenEntry.userId} успешно обновлён`,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: tokenEntry.userId },
    });

    await this.email.sendPasswordResetSuccessEmail(user.email);

    return { message: "Пароль успешно изменен" };
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string, // Добавлено
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        "Новый пароль и подтверждение не совпадают",
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException("Пользователь не найден");

    const isPasswordValid = await verify(user.password, currentPassword);
    if (!isPasswordValid)
      throw new BadRequestException("Неверный текущий пароль");

    const hashedPassword = await hash(newPassword);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // ✅ Отправка письма
    await this.email.sendPasswordResetSuccessEmail(user.email);

    return { message: "Пароль успешно изменен" };
  }

  // Обновление аватара пользователя
  async updateAvatar(userId: number, avatarPath: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath },
    });
  }

  // Получение корзины текущего пользователя
  async getBasket(currentUserId: number) {
    const basket = await this.prisma.basket.findMany({
      where: { userId: currentUserId },
      include: this.getBasketInclude(), // Включаем информацию о товарах и поставщиках
    });

    if (!basket.length) {
      throw new NotFoundException("Корзина пуста");
    }

    return basket;
  }

  // Получение заказов текущего пользователя
  async getOrders(currentUserId: number) {
    const orders = await this.prisma.orders.findMany({
      where: { userId: currentUserId },
      include: this.getOrderInclude(), // Включаем строки заказа, статусы и информацию о товарах
    });

    if (!orders.length) {
      throw new NotFoundException("Заказы не найдены");
    }

    return orders;
  }

  // Общая функция для включения связанной информации для заказов
  private getOrderInclude() {
    return {
      orderLines: {
        include: {
          orderLineStatus: true, // Включаем статусы строк заказа
          sku: {
            include: {
              brand: true, // Включаем бренд товара
            },
          },
          supplier: true, // Включаем информацию о поставщике
        },
      },
    };
  }

  // Общая функция для включения информации для корзины
  private getBasketInclude() {
    return {
      sku: {
        include: {
          brand: true, // Включаем бренд товара
        },
      },
      supplier: true, // Включаем информацию о поставщике
    };
  }
}
