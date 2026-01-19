/*
  Warnings:

  - You are about to drop the column `organizationId` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "History" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationId";
