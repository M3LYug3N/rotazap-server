import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CreateOrderStatusDto } from "@/modules/order-status/dto/order-status.dto";

import { OrderStatusService } from "./order-status.service";

@Controller("order-status")
@Auth()
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) {}

  @Post()
  async create(@Body() createOrderStatusDto: CreateOrderStatusDto) {
    return this.orderStatusService.create(createOrderStatusDto);
  }

  @Get()
  async findAll() {
    return this.orderStatusService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.orderStatusService.findOne(id);
  }
}
