-- CreatePost
CREATE TABLE "posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "thumbnail_url" VARCHAR,
    "excerpt" VARCHAR,
    "content" TEXT,
    "author_id" UUID,
    "status" VARCHAR NOT NULL DEFAULT 'DRAFT',
    "seo_title" VARCHAR,
    "seo_description" VARCHAR,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
CREATE INDEX "posts_slug_idx" ON "posts"("slug");
CREATE INDEX "posts_status_idx" ON "posts"("status");
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

COMMENT ON TABLE "posts" IS 'Blog posts and articles for the news/blog section';
