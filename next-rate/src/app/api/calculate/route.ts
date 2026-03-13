/**
 * ============================================================================
 * API 名：/api/calculate
 * 概要　：未計算の対局結果に対して Elo レートの差分再計算を行う
 * 層区分：Controller（計算ロジックはこの API 内で完結）
 *
 * 【処理概要】
 * ① 全対局を playedAt 昇順で取得
 * ② 未計算の最初の対局（境界）を特定
 * ③ プレイヤー初期レートを取得（currentRate は使用しない）
 * ④ 未計算対局に登場するプレイヤーを抽出
 * ⑤ 各プレイヤーの「開始レート」を復元（直前 1 件の対局を再計算）
 * ⑥ 未計算対局を順次 Elo 計算し、開始レート・終了レートを更新
 * ⑦ Result / Player を一括更新（トランザクション）
 *
 * 【注意事項】
 * ・差分計算方式のため、全件再計算は行わない
 * ・Result の winnerRate / loserRate は「開始レート」を保存する
 * ・Player.currentRate は「終了レート」を保存する
 * ・大量更新のため $executeRawUnsafe を使用（VALUES 句で高速化）
 *
 * 【例外処理方針】
 * ・本 API は POST のみ許可
 * ・try/catch は不要（Next.js が 500 を返すため）
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
 * POST /api/calculate
 * 機能：未計算対局の Elo レート差分再計算
 * ============================================================================
 */
export async function POST() {
  /* ------------------------------------------------------------------------
   * ① 全対局を playedAt 昇順で取得
   * ------------------------------------------------------------------------ */
  const allResults = await prisma.result.findMany({
    orderBy: { playedAt: "asc" },
  });

  /* ------------------------------------------------------------------------
   * ② 未計算の最初の対局（境界）を特定
   * ------------------------------------------------------------------------ */
  const startIndex = allResults.findIndex((r) => !r.isCalculated);
  if (startIndex === -1) {
    return NextResponse.json({ message: "全て計算済み" });
  }

  const targets = allResults.slice(startIndex);

  /* ------------------------------------------------------------------------
   * ③ プレイヤー初期レートを取得（currentRate は使わない）
   * ------------------------------------------------------------------------ */
  const players = await prisma.player.findMany();
  const initialRateMap = new Map(players.map((p) => [p.id, p.initialRate]));

  /* ------------------------------------------------------------------------
   * ④ 未計算対局に登場するプレイヤーを抽出
   * ------------------------------------------------------------------------ */
  const playerIds = new Set<string>();
  for (const m of targets) {
    playerIds.add(m.winnerId);
    playerIds.add(m.loserId);
  }

  /* ------------------------------------------------------------------------
   * ⑤ 各プレイヤーの開始レート復元
   *    → 直前 1 件の対局を再計算して終了レートを求める
   * ------------------------------------------------------------------------ */
  const rateMap = new Map<string, number>();

  for (const pid of playerIds) {
    const prevMatch = [...allResults.slice(0, startIndex)]
      .reverse()
      .find((m) => m.winnerId === pid || m.loserId === pid);

    if (!prevMatch) {
      rateMap.set(pid, initialRateMap.get(pid)!);
      continue;
    }

    const { newWinnerRate, newLoserRate } = calculateElo(
      prevMatch.winnerRate,
      prevMatch.loserRate
    );

    rateMap.set(
      pid,
      prevMatch.winnerId === pid ? newWinnerRate : newLoserRate
    );
  }

  /* ------------------------------------------------------------------------
   * ⑥ 未計算対局を順次 Elo 計算
   * ------------------------------------------------------------------------ */
  const resultUpdates: { id: string; winnerRate: number; loserRate: number }[] =
    [];
  const playerUpdates = new Map<string, number>();

  for (const match of targets) {
    const winnerStartRate = rateMap.get(match.winnerId)!;
    const loserStartRate = rateMap.get(match.loserId)!;

    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerStartRate,
      loserStartRate
    );

    // 次の対局に伝播
    rateMap.set(match.winnerId, newWinnerRate);
    rateMap.set(match.loserId, newLoserRate);

    // Result には開始レートを保存
    resultUpdates.push({
      id: match.id,
      winnerRate: winnerStartRate,
      loserRate: loserStartRate,
    });

    // Player.currentRate は終了レートで更新
    playerUpdates.set(match.winnerId, newWinnerRate);
    playerUpdates.set(match.loserId, newLoserRate);
  }

  /* ------------------------------------------------------------------------
   * ⑦ DB 更新（Result / Player を一括更新）
   * ------------------------------------------------------------------------ */
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
    message: "差分計算完了（全プレーヤー開始レート復元済み）",
    startIndex,
    updatedMatches: targets.length,
  });
}