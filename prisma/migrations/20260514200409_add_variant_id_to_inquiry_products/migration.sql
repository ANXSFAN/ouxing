-- AlterTable
ALTER TABLE "inquiry_products" ADD COLUMN "variant_id" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "inquiry_products_inquiry_id_product_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "inquiry_products_inquiry_id_product_id_variant_id_key" ON "inquiry_products"("inquiry_id", "product_id", "variant_id");

-- CreateIndex
CREATE INDEX "inquiry_products_variant_id_idx" ON "inquiry_products"("variant_id");

-- AddForeignKey
ALTER TABLE "inquiry_products" ADD CONSTRAINT "inquiry_products_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
