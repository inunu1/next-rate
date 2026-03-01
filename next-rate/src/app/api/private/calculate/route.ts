import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const K_FACTOR = 32;

function calculateElo(winnerRate: number, loserRate: number) {
  const expectedWin = 1 / (1 + Math.pow(10, (loserRate - winnerRate) / 400));
  const expectedLose = 1 - expectedWin;

  return {
    newWinnerRate: Math.round(winnerRate + K_FACTOR * (1 - expectedWin)),
    newLoserRate: Math.round(loserRate + K_FACTOR * (0 - expectedLose)),
  };
}

export async function POST() {
  const allResults = await prisma.result.findMany({
    orderBy: { playedAt: "asc" },
  });

  const startIndex = allResults.findIndex((r) => !r.isCalculated);
  if (startIndex === -1) {
    return NextResponse.json({ message: "全て計算済み" });
  }

  const firstUncalculated = allResults[startIndex];

  const players = await prisma.player.findMany();
  const initialRateMap = new Map(players.map((p) => [p.id, p.initialRate]));

  const rateMap = new Map<string, number>();

  const involvedPlayers = [
    firstUncalculated.winnerId,
    firstUncalculated.loserId,
  ];

  for (const pid of involvedPlayers) {
    const prevMatch = [...allResults.slice(0, startIndex)]
      .reverse()
      .find((m) => m.winnerId === pid || m.loserId === pid);

    if (!prevMatch) {
      rateMap.set(pid, initialRateMap.get(pid)!);
      continue;
    }

    const winnerStart = prevMatch.winnerRate;
    const loserStart = prevMatch.loserRate;

    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerStart,
      loserStart
    );

    if (prevMatch.winnerId === pid) {
      rateMap.set(pid, newWinnerRate);
    } else {
      rateMap.set(pid, newLoserRate);
    }
  }

  const targets = allResults.slice(startIndex);

  const resultUpdates = [];
  const playerUpdates = new Map<string, number>();

  for (const match of targets) {
    const winnerStartRate =
      rateMap.get(match.winnerId) ?? match.winnerRate;
    const loserStartRate =
      rateMap.get(match.loserId) ?? match.loserRate;

    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerStartRate,
      loserStartRate
    );

    rateMap.set(match.winnerId, newWinnerRate);
    rateMap.set(match.loserId, newLoserRate);

    resultUpdates.push({
      id: match.id,
      winnerRate: winnerStartRate,
      loserRate: loserStartRate,
    });

    playerUpdates.set(match.winnerId, newWinnerRate);
    playerUpdates.set(match.loserId, newLoserRate);
  }

  await prisma.$transaction([
    prisma.$executeRawUnsafe(`
      UPDATE "Result" AS r
      SET 
        "winnerRate" = v."winnerRate",
        "loserRate" = v."loserRate",
        "isCalculated" = true
      FROM (VALUES
        ${resultUpdates
          .map(
            (r) =>
              `('${r.id}', ${r.winnerRate}, ${r.loserRate})`
          )
          .join(",")}
      ) AS v("id", "winnerRate", "loserRate")
      WHERE r.id = v."id";
    `),

    prisma.$executeRawUnsafe(`
      UPDATE "Player" AS p
      SET "currentRate" = v."currentRate"
      FROM (VALUES
        ${Array.from(playerUpdates.entries())
          .map(([id, rate]) => `('${id}', ${rate})`)
          .join(",")}
      ) AS v("id", "currentRate")
      WHERE p.id = v."id";
    `),
  ]);

  return NextResponse.json({
    message: "差分計算完了（開始レート保存方式）",
    startIndex,
    updatedMatches: targets.length,
  });
}