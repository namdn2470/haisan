-- custom_roles
CREATE TABLE IF NOT EXISTS "custom_roles" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "color"       TEXT NOT NULL DEFAULT '#64748b',
    "permissions" TEXT[] NOT NULL DEFAULT '{}',
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    "is_system"   BOOLEAN NOT NULL DEFAULT false,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "custom_roles_name_key"  ON "custom_roles"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "custom_roles_slug_key"  ON "custom_roles"("slug");
CREATE        INDEX IF NOT EXISTS "custom_roles_is_active" ON "custom_roles"("is_active");
CREATE        INDEX IF NOT EXISTS "custom_roles_slug_idx"  ON "custom_roles"("slug");

-- homepage_sections
CREATE TABLE IF NOT EXISTS "homepage_sections" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug"        TEXT NOT NULL,
    "title"       TEXT NOT NULL DEFAULT '',
    "subtitle"    TEXT,
    "description" TEXT,
    "cta_text"    TEXT,
    "cta_url"     TEXT,
    "enabled"     BOOLEAN NOT NULL DEFAULT true,
    "sort_order"  INTEGER NOT NULL DEFAULT 0,
    "max_items"   INTEGER NOT NULL DEFAULT 3,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "homepage_sections_slug_key" ON "homepage_sections"("slug");

-- homepage_section_items
CREATE TABLE IF NOT EXISTS "homepage_section_items" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "section_id"  UUID NOT NULL,
    "product_id"  UUID NOT NULL,
    "sort_order"  INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "homepage_section_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "homepage_section_items_section_id_fkey"
        FOREIGN KEY ("section_id") REFERENCES "homepage_sections"("id") ON DELETE CASCADE,
    CONSTRAINT "homepage_section_items_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "homepage_section_items_section_id_product_id_key"
    ON "homepage_section_items"("section_id", "product_id");
CREATE        INDEX IF NOT EXISTS "homepage_section_items_section_id_idx"
    ON "homepage_section_items"("section_id");

-- site_configs
CREATE TABLE IF NOT EXISTS "site_configs" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "key"         TEXT NOT NULL,
    "value"       TEXT NOT NULL,
    "type"        TEXT NOT NULL DEFAULT 'string',
    "group"       TEXT NOT NULL DEFAULT 'general',
    "label"       TEXT,
    "description" TEXT,
    "isPublic"    BOOLEAN NOT NULL DEFAULT true,
    "sort_order"  INTEGER NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_configs_key_key"     ON "site_configs"("key");
CREATE        INDEX IF NOT EXISTS "site_configs_key_idx"     ON "site_configs"("key");
CREATE        INDEX IF NOT EXISTS "site_configs_group_idx"   ON "site_configs"("group");
CREATE        INDEX IF NOT EXISTS "site_configs_isPublic_idx" ON "site_configs"("isPublic");

-- store_settings
CREATE TABLE IF NOT EXISTS "store_settings" (
    "id"                    UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_name"            TEXT NOT NULL DEFAULT 'Hải Sản Biển Xanh',
    "store_description"     TEXT,
    "logo"                  TEXT,
    "favicon"               TEXT,
    "tax_code"              TEXT,
    "business_license"      TEXT,
    "phone"                 TEXT,
    "hotline"               TEXT,
    "email"                 TEXT,
    "address"               TEXT,
    "ward"                  TEXT,
    "district"              TEXT,
    "city"                  TEXT,
    "map_url"               TEXT,
    "opening_hours"         TEXT,
    "delivery_policy"       TEXT,
    "return_policy"         TEXT,
    "default_shipping_fee"  DECIMAL(10,2) NOT NULL DEFAULT 0,
    "default_shipping_zone" TEXT,
    "facebook_url"          TEXT,
    "zalo_url"              TEXT,
    "tiktok_url"            TEXT,
    "youtube_url"           TEXT,
    "instagram_url"         TEXT,
    "seo_title"             TEXT,
    "seo_description"       TEXT,
    "seo_keywords"          TEXT,
    "og_image"              TEXT,
    "is_active"             BOOLEAN NOT NULL DEFAULT true,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL,
    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);
