/**
 * ============================================================================
 * API 名　：/api/calculate（フル再計算）
 * 概要　　：全対局を playedAt 昇順で再計算し、レート整合性を完全保証する
 * 層区分　：Controller（計算ロジックは本 API 内で完結）
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const K_FACTOR = 32;
const CHUNK_SIZE = 100;

/* ---------------------------------------------------------------------------
 * Elo レート計算（1 対局分）
 * --------------------------------------------------------------------------- */
function calculateElo(winnerRate: number, loserRate: number) {
  const expectedWin = 1 / (1 + Math.pow(10, (loserRate - winnerRate) / 400));
  const expectedLose = 1 - expectedWin;

  return {
    newWinnerRate: Math.round(winnerRate + K_FACTOR * (1 - expectedWin)),
    newLoserRate: Math.round(loserRate + K_FACTOR * (0 - expectedLose)),
  };
}

/* ---------------------------------------------------------------------------
 * 配列をチャンクに分割
 * --------------------------------------------------------------------------- */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/* ============================================================================
 * POST /api/calculate（フル再計算 + 計測ポイント + 分割UPDATE）
 * ============================================================================
 */
export async function POST() {
  const t = () => performance.now();
  const metrics: { label: string; ms: number }[] = [];

  const totalStart = t();

  /* ① 全対局取得 */
  let s = t();
  const allResults = await prisma.result.findMany({
    orderBy: { playedAt: "asc" },
  });
  metrics.push({ label: "fetch_results", ms: t() - s });

  /* ② 全プレイヤー取得 */
  s = t();
  const players = await prisma.player.findMany();
  metrics.push({ label: "fetch_players", ms: t() - s });

  const rateMap = new Map(players.map((p) => [p.id, p.initialRate]));
  const resultUpdates: {
    id: string;
    winnerRate: number;
    loserRate: number;
  }[] = [];

  /* ③ Elo ループ */
  s = t();
  for (const match of allResults) {
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
      winnerRate,
      loserRate,
    });
  }
  metrics.push({ label: "elo_loop", ms: t() - s });

  /* ④ Player の最終レート抽出 */
  const playerUpdates = Array.from(rateMap.entries());

  /* ⑤ 分割 UPDATE */
  s = t();

  // Result の分割 UPDATE
  const resultChunks = chunk(resultUpdates, CHUNK_SIZE);
  for (const c of resultChunks) {
    await prisma.$executeRawUnsafe(`
      UPDATE "Result" AS r
      SET 
        "winnerRate" = v."winnerRate",
        "loserRate" = v."loserRate",
        "isCalculated" = true
      FROM (VALUES
        ${c
          .map(
            (r) => `('${r.id}', ${r.winnerRate}, ${r.loserRate})`
          )
          .join(",")}
      ) AS v("id", "winnerRate", "loserRate")
      WHERE r.id = v."id";
    `);
  }

  // Player の分割 UPDATE
  const playerChunks = chunk(playerUpdates, CHUNK_SIZE);
  for (const c of playerChunks) {
    await prisma.$executeRawUnsafe(`
      UPDATE "Player" AS p
      SET "currentRate" = v."currentRate"
      FROM (VALUES
        ${c.map(([id, rate]) => `('${id}', ${rate})`).join(",")}
      ) AS v("id", "currentRate")
      WHERE p.id = v."id";
    `);
  }

  metrics.push({ label: "update_db", ms: t() - s });

  /* ⑥ 総処理時間 */
  metrics.push({ label: "total", ms: t() - totalStart });

  return NextResponse.json({
    message: "フル再計算完了（整合性100%保証・分割UPDATE適用）",
    totalMatches: allResults.length,
    metrics,
  });
}