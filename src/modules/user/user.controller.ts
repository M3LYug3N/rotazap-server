import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Res,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import type { Response } from "express";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CurrentUser } from "@/modules/auth/decorators/user.decorator";
import { UpdateUserDto } from "@/modules/user/dto/update-user.dto";

import { jwtAccessExpiration, jwtRefreshExpiration } from "@/common/constants";

import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put("update-role")
  async updateUserRole(
    @Body() { userId, role }: { userId: number; role: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.userService.updateRole(userId, role);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: jwtAccessExpiration,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: jwtRefreshExpiration,
    });

    return user;
  }

  // Получение профиля пользователя
  @Auth()
  @Get("profile")
  async getProfile(@CurrentUser("id") id: number) {
    return this.userService.byId(id);
  }

  // Обновление профиля пользователя
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Auth()
  @Put("profile")
  async updateProfile(
    @CurrentUser("id") id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateProfile(id, dto);
  }

  // Отправка ссылки для восстановления пароля
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("forgot-password")
  async forgotPassword(@Body("email") email: string) {
    return this.userService.initiatePasswordReset(email);
  }

  // Установка нового пароля
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("reset-password")
  async resetPassword(
    @Body("token") token: string,
    @Body("newPassword") newPassword: string,
    @Body("confirmPassword") confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException("Пароли не совпадают");
    }

    return this.userService.resetPassword(token, newPassword);
  }

  @Auth()
  @UsePipes(new ValidationPipe())
  @Put("change-password")
  async changePassword(
    @CurrentUser("id") id: number,
    @Body("currentPassword") currentPassword: string,
    @Body("newPassword") newPassword: string,
    @Body("confirmPassword") confirmPassword: string,
  ) {
    return this.userService.changePassword(
      id,
      currentPassword,
      newPassword,
      confirmPassword,
    );
  }

  @Auth()
  @Get("basket")
  async getUserBasket(@CurrentUser("id") currentUserId: number) {
    return this.userService.getBasket(currentUserId);
  }

  @Auth()
  @Get("orders")
  async getUserOrders(@CurrentUser("id") currentUserId: number) {
    return this.userService.getOrders(currentUserId);
  }
}
