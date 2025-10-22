-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL,
    "legalForm" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "priceListId" INTEGER NOT NULL DEFAULT 1,
    "role" TEXT NOT NULL DEFAULT 'pending',
    "avatar_path" TEXT NOT NULL DEFAULT '/upload/default-avatar.png',
    "refreshToken" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "basket" (
    "userId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "descr" TEXT,
    "hash" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION,
    "deliveryDays" INTEGER,

    CONSTRAINT "basket_pkey" PRIMARY KEY ("userId","skuId","supplierId","hash")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReceived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_price" (
    "priceListId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "offer_price_pkey" PRIMARY KEY ("priceListId","supplierId","skuId")
);

-- CreateTable
CREATE TABLE "order_lines_status" (
    "id" SERIAL NOT NULL,
    "orderLineId" INTEGER NOT NULL,
    "orderStatusId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_lines_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "descr" TEXT,
    "basePrice" DOUBLE PRECISION,
    "deliveryDays" INTEGER,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "order_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku_names" (
    "id" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "sku_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku" (
    "id" INTEGER NOT NULL,
    "brandId" INTEGER NOT NULL,
    "article" TEXT NOT NULL,

    CONSTRAINT "sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers_offers" (
    "supplierId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "suppliers_offers_pkey" PRIMARY KEY ("supplierId","skuId","basePrice")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" INTEGER NOT NULL,
    "stock" BOOLEAN NOT NULL,
    "deliveryDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "order_status_name_key" ON "order_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_name_key" ON "price_list"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_userId_key" ON "password_reset_token"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_key" ON "password_reset_token"("token");

-- AddForeignKey
ALTER TABLE "basket" ADD CONSTRAINT "basket_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket" ADD CONSTRAINT "basket_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket" ADD CONSTRAINT "basket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_price" ADD CONSTRAINT "offer_price_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_price" ADD CONSTRAINT "offer_price_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_price" ADD CONSTRAINT "offer_price_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines_status" ADD CONSTRAINT "order_lines_status_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "order_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines_status" ADD CONSTRAINT "order_lines_status_orderStatusId_fkey" FOREIGN KEY ("orderStatusId") REFERENCES "order_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_names" ADD CONSTRAINT "sku_names_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku" ADD CONSTRAINT "sku_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers_offers" ADD CONSTRAINT "suppliers_offers_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers_offers" ADD CONSTRAINT "suppliers_offers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

