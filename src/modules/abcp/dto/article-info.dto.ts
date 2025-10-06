export interface ArticleInfoDto {
  brand: string;
  number: string;
  descr?: string;
  properties?: Record<string, string>;
  images?: string[];
  crosses: CrossItemDto[];
  localOffers: {
    groupName: string;
    items: LocalOfferGroup[];
  }[];
}

export interface CrossItemDto {
  brand: string;
  number: string;
  numberFix?: string;
  crossType?: number;
  reliable?: boolean;
}

export interface LocalOffer {
  skuId: number;
  supplierId: number;
  price: number;
  basePrice: number;
  qty: number;
  hash: string;
  deliveryDays: number;
}

export interface LocalOfferGroup {
  brand: string;
  number: string;
  offers: LocalOffer[];
}
