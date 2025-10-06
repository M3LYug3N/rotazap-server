export class OrderItemStatusDto {
  id: number;
  status: string;
  qty: number;
  createdAt: Date;
}

export class OrderItemDto {
  skuId: number;
  supplierId: number;
  article: string;
  brand: string;
  descr: string;
  qty: number;
  price: number;
  basePrice: number;
  statuses: OrderItemStatusDto[];
}

export class OrderResponseDto {
  id: number;
  createdAt: Date;
  items: OrderItemDto[];
  orderNumber: string;
}
