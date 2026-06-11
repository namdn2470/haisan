-- Add missing UserRole enum values: SUPER_ADMIN and MANAGER
-- These exist in schema.prisma but were not in the initial migration

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'UserRole' AND e.enumlabel = 'SUPER_ADMIN'
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'UserRole' AND e.enumlabel = 'MANAGER'
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
    END IF;
END $$;
