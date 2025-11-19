-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "winnerName" TEXT NOT NULL,
    "winnerRate" INTEGER NOT NULL,
    "loserId" TEXT NOT NULL,
    "loserName" TEXT NOT NULL,
    "loserRate" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);
