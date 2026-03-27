-- Add content column to categories with default, then migrate data
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "content" JSONB DEFAULT '{}';
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" TEXT;
-- Migrate existing name/description to content JSON
UPDATE "categories" SET "content" = jsonb_build_object(
  'zh', jsonb_build_object('name', COALESCE("name", ''), 'description', COALESCE("description", '')),
  'en', jsonb_build_object('name', COALESCE("name", ''), 'description', COALESCE("description", ''))
) WHERE "content" = '{}';
-- Drop old columns
ALTER TABLE "categories" DROP COLUMN IF EXISTS "name";
ALTER TABLE "categories" DROP COLUMN IF EXISTS "description";
-- Make content NOT NULL after migration
ALTER TABLE "categories" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "content" DROP DEFAULT;
-- Add FK for parent
DO $$ BEGIN
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Modify products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "content" JSONB DEFAULT '{}';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specs" JSONB;
-- Migrate product data
UPDATE "products" SET "content" = jsonb_build_object(
  'zh', jsonb_build_object('name', COALESCE("name", ''), 'description', COALESCE("description", '')),
  'en', jsonb_build_object('name', COALESCE("name", ''), 'description', COALESCE("description", ''))
) WHERE "content" = '{}';
UPDATE "products" SET "slug" = LOWER(REPLACE("model_number", ' ', '-')) WHERE "slug" IS NULL;
-- Make content NOT NULL
ALTER TABLE "products" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "content" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;
-- Add unique on slug
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_key" ON "products"("slug");
-- Make categoryId optional
ALTER TABLE "products" ALTER COLUMN "category_id" DROP NOT NULL;
-- Drop old columns
ALTER TABLE "products" DROP COLUMN IF EXISTS "name";
ALTER TABLE "products" DROP COLUMN IF EXISTS "description";
ALTER TABLE "products" DROP COLUMN IF EXISTS "wattage";
ALTER TABLE "products" DROP COLUMN IF EXISTS "color_temperature";
ALTER TABLE "products" DROP COLUMN IF EXISTS "lumens";
ALTER TABLE "products" DROP COLUMN IF EXISTS "cri";
ALTER TABLE "products" DROP COLUMN IF EXISTS "beam_angle";
ALTER TABLE "products" DROP COLUMN IF EXISTS "ip_rating";
ALTER TABLE "products" DROP COLUMN IF EXISTS "voltage";
ALTER TABLE "products" DROP COLUMN IF EXISTS "dimensions";
ALTER TABLE "products" DROP COLUMN IF EXISTS "weight";
ALTER TABLE "products" DROP COLUMN IF EXISTS "material";
ALTER TABLE "products" DROP COLUMN IF EXISTS "lifespan";
ALTER TABLE "products" DROP COLUMN IF EXISTS "warranty";
ALTER TABLE "products" DROP COLUMN IF EXISTS "extra_specs";

-- Create attribute tables
CREATE TABLE IF NOT EXISTS "attribute_definitions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" JSONB NOT NULL,
  "key" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "unit" TEXT,
  "scope" TEXT NOT NULL,
  "is_highlight" BOOLEAN NOT NULL DEFAULT false,
  "is_filterable" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attribute_definitions_key_key" ON "attribute_definitions"("key");

CREATE TABLE IF NOT EXISTS "attribute_options" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "value" TEXT NOT NULL,
  "color" TEXT,
  "attribute_id" TEXT NOT NULL,
  CONSTRAINT "attribute_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attribute_options_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
