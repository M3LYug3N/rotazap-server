import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import type { User } from "@prisma/client";

export const CurrentUser = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      console.warn("⚠️ CurrentUser: request.user is undefined");
      return undefined;
    }

    return data ? user[data] : user;
  },
);
