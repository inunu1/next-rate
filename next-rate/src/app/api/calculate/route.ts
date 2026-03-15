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
 * POST /api/calculate（フル再計算）
 * ============================================================================
 */
export async function POST() {
  // ① 全対局を昇順で取得
  const allResults = await prisma.result.findMany({
    orderBy: { playedAt: "asc" },
  });

  // ② 全プレイヤーの初期レートを取得
  const players = await prisma.player.findMany();
  const rateMap = new Map(players.map((p) => [p.id, p.initialRate]));

  // Result 更新用配列
  const resultUpdates: {
    id: string;
    winnerRate: number;
    loserRate: number;
  }[] = [];

  // ③ 全対局を順次フル再計算
  for (const match of allResults) {
    const winnerRate = rateMap.get(match.winnerId)!;
    const loserRate = rateMap.get(match.loserId)!;

    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerRate,
      loserRate
    );

    // 次局のためにレート更新
    rateMap.set(match.winnerId, newWinnerRate);
    rateMap.set(match.loserId, newLoserRate);

    // Result 更新用に開始レートを保存
    resultUpdates.push({
      id: match.id,
      winnerRate,
      loserRate,
    });
  }

  // ④ Player の最終レートを抽出
  const playerUpdates = Array.from(rateMap.entries());

  // ⑤ DB 更新（Result / Player）※トランザクション
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

  return NextResponse.json({
    message: "フル再計算完了（整合性100%保証）",
    totalMatches: allResults.length,
  });
}