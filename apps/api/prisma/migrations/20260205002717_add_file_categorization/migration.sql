-- AlterTable
ALTER TABLE "ContextFile" ADD COLUMN "category" TEXT;
ALTER TABLE "ContextFile" ADD COLUMN "confidence" REAL;
ALTER TABLE "ContextFile" ADD COLUMN "reasoning" TEXT;

-- CreateIndex
CREATE INDEX "ContextFile_category_idx" ON "ContextFile"("category");
