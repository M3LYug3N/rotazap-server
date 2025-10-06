import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { UpdateOrderLineDto } from "@/modules/order-lines/dto/update-order-line.dto";

import { CreateOrderLineDto } from "./dto/create-order-line.dto";
import { OrderLinesService } from "./order-lines.service";

@Controller("order-lines")
@Auth()
export class OrderLinesController {
  constructor(private readonly orderLinesService: OrderLinesService) {}

  @Post()
  create(@Body() createOrderLineDto: CreateOrderLineDto) {
    return this.orderLinesService.create(createOrderLineDto);
  }

  @Get()
  findAll() {
    return this.orderLinesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orderLinesService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateOrderLineDto: UpdateOrderLineDto,
  ) {
    return this.orderLinesService.update(+id, updateOrderLineDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.orderLinesService.remove(+id);
  }
}
