import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CurrentUser } from "@/modules/auth/decorators/user.decorator";
import { OrdersService } from "@/modules/orders/orders.service";

import { CreateOrderDto } from "./dto/create-order.dto";

@Auth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  async create(@CurrentUser("id") userId: number, @Body() dto: CreateOrderDto) {
    console.log("🔥 [Controller] Тело запроса:", JSON.stringify(dto, null, 2));

    const first = dto.items?.[0];

    console.log("🔎 Первый элемент:", first);
    console.log("🔎 constructor:", first?.constructor?.name);

    // лог типов полей
    if (first) {
      console.log("📊 Типы полей:");
      for (const [key, value] of Object.entries(first)) {
        console.log(`- ${key}:`, typeof value, "|", value);
      }
    }

    await this.orderService.validateOrderBeforeCreation(dto);
    return this.orderService.createOrder(userId, dto);
  }

  @Get()
  getOrders(@CurrentUser("id") userId: number) {
    return this.orderService.getUserOrders(userId);
  }

  @Post("validate")
  @HttpCode(204)
  validate(@Body() dto: CreateOrderDto) {
    return this.orderService.validateOrderBeforeCreation(dto);
  }
}
