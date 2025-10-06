import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CurrentUser } from "@/modules/auth/decorators/user.decorator";
import { LoginDto } from "@/modules/auth/dto/login.dto";
import { RegisterDto } from "@/modules/auth/dto/register.dto";

import { jwtAccessExpiration, jwtRefreshExpiration } from "@/common/constants";

import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(dto);

    this.setCookies(res, accessToken, refreshToken);

    return { user };
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);

    this.setCookies(res, accessToken, refreshToken);

    return { user };
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("login/access-token")
  async getNewTokens(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token отсутствует" });
    }

    try {
      const {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      } = await this.authService.getNewTokens({ refreshToken });

      this.setCookies(res, accessToken, newRefreshToken);

      return res.status(200).json({ user });
    } catch (error) {
      console.error("Ошибка при обновлении токена:", error.message);
      return res.status(401).json({ message: "Не удалось обновить токен" });
    }
  }

  @Auth()
  @Get("me")
  async getCurrentUser(@CurrentUser() user) {
    const currentUser = await this.authService.getUserById(user.id);
    return { user: currentUser };
  }

  @Auth()
  @HttpCode(200)
  @Post("logout")
  async logout(@CurrentUser() user, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);

    this.clearCookies(res);

    return { message: "Выход выполнен" };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
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
  }

  private clearCookies(res: Response) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
}
