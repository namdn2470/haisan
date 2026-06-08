-- Migration: Add shipping_zones table
-- Created: 2026-06-09

BEGIN;

CREATE TABLE "shipping_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "province" VARCHAR(100),
    "district" VARCHAR(100),
    "shipping_fee" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "free_from_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "estimated_days" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipping_zones_is_active_idx" ON "shipping_zones"("is_active");
CREATE INDEX "shipping_zones_sort_order_idx" ON "shipping_zones"("sort_order");

COMMENT ON TABLE "shipping_zones" IS 'Shipping zones with fee, free shipping threshold, and estimated delivery days';

COMMIT;
