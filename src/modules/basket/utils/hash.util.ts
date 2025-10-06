import * as crypto from "crypto";

/** Детерминированный hash по ключу позиции (резерв при отсутствии hash в dto) */
export const defaultBasketHash = (skuId: number, supplierId: number): string =>
  crypto.createHash("md5").update(`${skuId}-${supplierId}`).digest("hex");
