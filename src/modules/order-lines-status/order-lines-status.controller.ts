import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CreateOrderLinesStatusDto } from "@/modules/order-lines-status/dto/create-order-lines-status.dto";
import { OrderLinesStatusService } from "@/modules/order-lines-status/order-lines-status.service";

@Controller("order-lines-status")
@Auth()
export class OrderLinesStatusController {
  constructor(
    private readonly orderLinesStatusService: OrderLinesStatusService,
  ) {}

  // Добавление нового статуса для строки заказа
  @Post()
  async create(@Body() createOrderLineStatusDto: CreateOrderLinesStatusDto) {
    return this.orderLinesStatusService.create(createOrderLineStatusDto);
  }

  // Получение всех статусов для строки заказа (история)
  @Get(":orderLineId")
  async getStatusesForOrderLine(
    @Param("orderLineId", ParseIntPipe) orderLineId: number,
  ) {
    return this.orderLinesStatusService.getStatusesForOrderLine(orderLineId);
  }

  // Получение таймлайна для строки заказа
  @Get(":orderLineId/timeline")
  async getTimelineForOrderLine(
    @Param("orderLineId", ParseIntPipe) orderLineId: number,
  ) {
    return this.orderLinesStatusService.getTimelineForOrderLine(orderLineId);
  }
}
