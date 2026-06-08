-- Migration: Add inventory_logs table
-- Created: 2026-06-09

BEGIN;

CREATE TYPE "InventoryLogType" AS ENUM ('IMPORT', 'EXPORT', 'ADJUSTMENT');

CREATE TABLE "inventory_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "type" "InventoryLogType" NOT NULL,
    "quantity" DECIMAL(12, 2) NOT NULL,
    "old_quantity" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "new_quantity" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_logs_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX "inventory_logs_product_id_idx" ON "inventory_logs"("product_id");
CREATE INDEX "inventory_logs_variant_id_idx" ON "inventory_logs"("variant_id");
CREATE INDEX "inventory_logs_type_idx" ON "inventory_logs"("type");
CREATE INDEX "inventory_logs_created_by_idx" ON "inventory_logs"("created_by");
CREATE INDEX "inventory_logs_created_at_idx" ON "inventory_logs"("created_at");

COMMENT ON TABLE "inventory_logs" IS 'Inventory change history for audit and tracking';

COMMENT ON COLUMN "inventory_logs"."type" IS 'IMPORT: nhập kho, EXPORT: xuất kho/bán, ADJUSTMENT: điều chỉnh tay';

COMMIT;
