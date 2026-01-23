/*
  Warnings:

  - You are about to drop the column `archived` on the `Result` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Result" DROP COLUMN "archived",
ADD COLUMN     "archivedAt" TIMESTAMP(3);
