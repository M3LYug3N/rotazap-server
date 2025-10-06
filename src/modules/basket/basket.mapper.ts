import { BasketItemResponseDto } from "@/modules/basket/dto/basket-item-response.dto";

/** Преобразование записи корзины к ответу API */
export const mapBasketToResponse = (
  item: any,
  availableQty: number,
): BasketItemResponseDto => ({
  skuId: item.skuId,
  supplierId: item.supplierId,
  article: item.sku.article,
  brand: item.sku.brand.name,
  descr: item.descr?.trim() || item.sku.skuNames[0]?.name || "",
  price: item.price,
  basePrice: item.basePrice,
  qty: item.qty,
  hash: item.hash,
  availableQty,
  deliveryDays: item.deliveryDays ?? null,
});
