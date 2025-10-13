-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funnel" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TEXT,
    "layout" TEXT,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "rolloutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ProductRecommendDiscountID" TEXT,
    "GiftAutoAddDiscountID" TEXT,
    "ManualAddDiscountID" TEXT,
    "CartProgressBarDiscountID" TEXT,
    "freeShippingID" TEXT,
    "upsellDownsellID" TEXT,
    "checkoutRecommendationType" TEXT,
    "cartRecommendationType" TEXT,
    "productRecommendationType" TEXT,
    "cartRecommendationAutoSuggestion" BOOLEAN NOT NULL DEFAULT false,
    "productRecommendationAutoSuggestion" BOOLEAN NOT NULL DEFAULT false,
    "groups" JSONB,
    "milestones" JSONB,
    "freeGiftAutoAdd" JSONB,
    "freeGiftSelect" JSONB,
    "upsellDownSellProduct" JSONB,
    "recommendationCheckout" JSONB,
    "recommendationCart" JSONB,
    "recommendationProduct" JSONB,
    "block" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalAppConfig" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "CouponName" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopEmail" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopPlan" TEXT NOT NULL,
    "shopCreatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastProductSync" TIMESTAMP(3),
    "lastOrderSync" TIMESTAMP(3),
    "isOrderSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalAppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferCustomization" (
    "id" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "styles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaultOfferStyle" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "styles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultOfferStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderHistory" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "totalPrice" TEXT NOT NULL,
    "subtotalPrice" TEXT NOT NULL,
    "totalTax" TEXT NOT NULL,
    "totalDiscounts" TEXT NOT NULL,
    "totalShipping" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "financialStatus" TEXT,
    "fulfillmentStatus" TEXT,
    "tags" TEXT,
    "note" TEXT,
    "customer" JSONB,
    "shippingAddress" JSONB,
    "billingAddress" JSONB,
    "products" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeGiftTracking" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "giftVariantId" TEXT NOT NULL,
    "giftProductId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeGiftTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Funnel_shop_type_active_deletedAt_idx" ON "Funnel"("shop", "type", "active", "deletedAt");

-- CreateIndex
CREATE INDEX "Funnel_shop_updatedAt_idx" ON "Funnel"("shop", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalAppConfig_shop_key" ON "GlobalAppConfig"("shop");

-- CreateIndex
CREATE INDEX "GlobalAppConfig_shop_idx" ON "GlobalAppConfig"("shop");

-- CreateIndex
CREATE INDEX "OfferCustomization_store_idx" ON "OfferCustomization"("store");

-- CreateIndex
CREATE INDEX "OfferCustomization_type_idx" ON "OfferCustomization"("type");

-- CreateIndex
CREATE UNIQUE INDEX "OfferCustomization_store_type_key" ON "OfferCustomization"("store", "type");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultOfferStyle_type_key" ON "DefaultOfferStyle"("type");

-- CreateIndex
CREATE INDEX "DefaultOfferStyle_type_idx" ON "DefaultOfferStyle"("type");

-- CreateIndex
CREATE INDEX "OrderHistory_shop_createdAt_idx" ON "OrderHistory"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "OrderHistory_email_idx" ON "OrderHistory"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrderHistory_id_shop_key" ON "OrderHistory"("id", "shop");

-- CreateIndex
CREATE INDEX "FreeGiftTracking_shop_customerId_idx" ON "FreeGiftTracking"("shop", "customerId");

-- CreateIndex
CREATE INDEX "FreeGiftTracking_shop_orderId_idx" ON "FreeGiftTracking"("shop", "orderId");
