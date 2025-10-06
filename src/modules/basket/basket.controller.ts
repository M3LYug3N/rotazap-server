// src/modules/basket/basket.controller.ts
import { Body, Controller, Delete, Get, HttpCode, Post } from "@nestjs/common";

import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CurrentUser } from "@/modules/auth/decorators/user.decorator";
import { BasketDiffItem } from "@/modules/basket/dto/basket-diff-item.dto";
import { CompareBasketItemDto } from "@/modules/basket/dto/compare-basket.dto";

import { BasketService } from "./basket.service";
import { AddBasketItemDto } from "./dto/add-basket-item.dto";
import { BasketItemResponseDto } from "./dto/basket-item-response.dto";
import { DeleteBasketItemDto } from "./dto/delete-basket-item.dto";
import { RemoveBasketItemDto } from "./dto/remove-basket-item.dto";

@Auth()
@Controller("basket")
export class BasketController {
  constructor(private readonly basketService: BasketService) {}

  /* Получить корзину */
  @Get()
  async getBasket(
    @CurrentUser("id") userId: number,
  ): Promise<BasketItemResponseDto[]> {
    return this.basketService.getBasket(userId);
  }

  /* Добавить 1 ед. в корзину */
  @Post("add")
  async addToBasket(
    @CurrentUser("id") userId: number,
    @Body() dto: AddBasketItemDto,
  ): Promise<BasketItemResponseDto> {
    return this.basketService.addToBasket(userId, dto);
  }

  /* Удалить 1 ед. из корзины */
  @Post("remove")
  async removeFromBasket(
    @CurrentUser("id") userId: number,
    @Body() dto: RemoveBasketItemDto,
  ): Promise<BasketItemResponseDto> {
    return this.basketService.removeFromBasket(userId, dto);
  }

  /* Удалить из корзины полностью */
  @Post("delete")
  @HttpCode(204)
  async deleteFromBasket(
    @CurrentUser("id") userId: number,
    @Body() dto: DeleteBasketItemDto,
  ): Promise<void> {
    await this.basketService.deleteFromBasket(userId, dto);
  }

  /* Очистить всю корзину пользователя */
  @Delete("clear")
  @HttpCode(204)
  async clearBasket(@CurrentUser("id") userId: number): Promise<void> {
    await this.basketService.clearBasket(userId);
  }

  /* Сравнение цены и количества в корзине */
  @Post("compare")
  async compareBasket(
    @CurrentUser("id") userId: number,
    @Body() dto: CompareBasketItemDto[],
  ): Promise<BasketDiffItem[]> {
    return this.basketService.compareWithServerState(userId, dto);
  }
}
