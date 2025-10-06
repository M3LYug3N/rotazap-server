export class BasketDiffItem {
  skuId: number;
  supplierId: number;

  article: string;
  brand: string;
  description: string;

  oldPrice?: number;
  newPrice?: number;

  oldQty?: number;
  newQty?: number;
}
