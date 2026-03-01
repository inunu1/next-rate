import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const K_FACTOR = 32;

/** Eloレート計算 */
function calculateElo(winnerRate: number, loserRate: number) {
  const expectedWin = 1 / (1 + Math.pow(10, (loserRate - winnerRate) / 400));
  const expectedLose = 1 - expectedWin;

  return {
    newWinnerRate: Math.round(winnerRate + K_FACTOR * (1 - expectedWin)),
    newLoserRate: Math.round(loserRate + K_FACTOR * (0 - expectedLose)),
  };
}

export async function POST() {
  // ① 全対局を playedAt 昇順で取得
  const allResults = await prisma.result.findMany({
    orderBy: { playedAt: "asc" },
  });

  // ② 未計算の最初の対局（境界）を特定
  const startIndex = allResults.findIndex((r) => !r.isCalculated);
  if (startIndex === -1) {
    return NextResponse.json({ message: "全て計算済み", mode: "noop" });
  }

  const firstUncalculated = allResults[startIndex];

  // ③ 全プレイヤーの currentRate を初期値として読み込み
  const players = await prisma.player.findMany();
  const rateMap = new Map(players.map((p) => [p.id, p.currentRate]));

  // ④ 境界プレイヤーの開始レート復元
  const involvedPlayers = [
    firstUncalculated.winnerId,
    firstUncalculated.loserId,
  ];

  for (const pid of involvedPlayers) {
    // ④-1: 直前の対局を検索
    const prevMatch = [...allResults.slice(0, startIndex)]
      .reverse()
      .find((m) => m.winnerId === pid || m.loserId === pid);

    if (!prevMatch) {
      // 直前の対局が無い場合 → 初期レート
      const player = players.find((p) => p.id === pid);
      rateMap.set(pid, player!.initialRate);
      continue;
    }

    // ④-2: 直前の対局の開始レート
    const winnerStart = prevMatch.winnerRate;
    const loserStart = prevMatch.loserRate;

    // ④-3: 直前の対局を1件だけ再計算し終了レートを復元
    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerStart,
      loserStart
    );

    // ④-4: 対象プレイヤーの開始レートとして反映
    if (prevMatch.winnerId === pid) {
      rateMap.set(pid, newWinnerRate);
    } else {
      rateMap.set(pid, newLoserRate);
    }
  }

  // ⑤ 差分計算本体
  const targets = allResults.slice(startIndex);

  const resultUpdates = [];
  const playerUpdates = new Map<string, number>();

  for (const match of targets) {
    const winnerRate = rateMap.get(match.winnerId)!;
    const loserRate = rateMap.get(match.loserId)!;

    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerRate,
      loserRate
    );

    rateMap.set(match.winnerId, newWinnerRate);
    rateMap.set(match.loserId, newLoserRate);

    resultUpdates.push({
      id: match.id,
      winnerRate: newWinnerRate,
      loserRate: newLoserRate,
    });

    playerUpdates.set(match.winnerId, newWinnerRate);
    playerUpdates.set(match.loserId, newLoserRate);
  }

  // ⑥ DB 更新（VALUES 句のカラム名を "..." で囲む → PostgreSQL 42703 回避）
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
    message: "差分計算完了（開始レート復元あり）",
    startIndex,
    updatedMatches: targets.length,
  });
}