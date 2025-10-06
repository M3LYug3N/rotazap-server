import { createHash } from "crypto";

export const generateBasketHash = (
  skuId: number,
  supplierId: number,
  basePrice: number,
  price: number,
  qty: number,
  deliveryDays: number,
): string => {
  return createHash("md5")
    .update(
      `${skuId}-${supplierId}-${basePrice}-${price}-${qty}-${deliveryDays}`,
    )
    .digest("hex");
};
