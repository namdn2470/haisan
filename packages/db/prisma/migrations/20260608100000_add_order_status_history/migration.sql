-- CreateOrderStatusHistory
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "status" VARCHAR NOT NULL,
    "note" VARCHAR,
    "actor_id" UUID,
    "actor_name" VARCHAR,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- Add index
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

-- Add foreign key
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" 
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comment
COMMENT ON TABLE "order_status_history" IS 'Tracks order status changes with timestamps and actors';
