/*
  Warnings:

  - You are about to drop the column `content` on the `BuildResult` table. All the data in the column will be lost.
  - Added the required column `code` to the `BuildResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docs` to the `BuildResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tests` to the `BuildResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BuildResult" DROP COLUMN "content",
ADD COLUMN     "code" JSONB NOT NULL,
ADD COLUMN     "conversationLog" TEXT,
ADD COLUMN     "docs" JSONB NOT NULL,
ADD COLUMN     "tests" JSONB NOT NULL;
