-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN "variant_id" TEXT;

-- CreateIndex
CREATE INDEX "quote_items_variant_id_idx" ON "quote_items"("variant_id");

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
