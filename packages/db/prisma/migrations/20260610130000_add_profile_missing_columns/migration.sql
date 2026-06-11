-- profiles: thêm các cột bị thiếu so với schema hiện tại
ALTER TABLE "profiles"
    ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
    ADD COLUMN IF NOT EXISTS "custom_role_id" UUID;

-- Unique index cho phone (đã có column nhưng chưa có constraint)
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_phone_key" ON "profiles"("phone");

-- FK: profiles.custom_role_id → custom_roles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_custom_role_id_fkey'
    ) THEN
        ALTER TABLE "profiles"
            ADD CONSTRAINT "profiles_custom_role_id_fkey"
            FOREIGN KEY ("custom_role_id") REFERENCES "custom_roles"("id")
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;
