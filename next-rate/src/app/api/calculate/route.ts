/**
 * ============================================================================
 * API 名　：/api/calculate（フル再計算）
 * 概要　　：全対局を playedAt 昇順で再計算し、レート整合性を完全保証する
 * 層区分　：Controller（計算ロジックは本 API 内で完結）
 *
 * 【本 API の目的】
 * ・削除・過去挿入・ID 不整合などによるレート破綻を完全に排除する
 * ・Elo の状態遷移特性に基づき、全件再計算により正しいレートを復元する
 *
 * 【処理概要】
 * ① 全対局を playedAt 昇順で取得
 * ② 全プレイヤーのレートを初期化
 * ③ 1 局ずつ Elo 計算を実施
 * ④ Result（開始レート）を更新
 * ⑤ Player（最終レート）を更新
 * ⑥ トランザクションで一括反映
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const K_FACTOR = 32;

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

/* ============================================================================
 * POST /api/calculate（フル再計算 + 計測ポイント）
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

  /* ⑤ DB 更新（Result / Player） */
  s = t();
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
            (r) => `('${r.id}', ${r.winnerRate}, ${r.loserRate})`
          )
          .join(",")}
      ) AS v("id", "winnerRate", "loserRate")
      WHERE r.id = v."id";
    `),

    prisma.$executeRawUnsafe(`
      UPDATE "Player" AS p
      SET "currentRate" = v."currentRate"
      FROM (VALUES
        ${playerUpdates
          .map(([id, rate]) => `('${id}', ${rate})`)
          .join(",")}
      ) AS v("id", "currentRate")
      WHERE p.id = v."id";
    `),
  ]);
  metrics.push({ label: "update_db", ms: t() - s });

  /* ⑥ 総処理時間 */
  metrics.push({ label: "total", ms: t() - totalStart });

  return NextResponse.json({
    message: "フル再計算完了（整合性100%保証）",
    totalMatches: allResults.length,
    metrics,
  });
}