-- DropIndex
DROP INDEX "Player_name_key";

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "winnerName" TEXT NOT NULL,
    "winnerRate" INTEGER NOT NULL,
    "loserId" TEXT NOT NULL,
    "loserName" TEXT NOT NULL,
    "loserRate" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);
