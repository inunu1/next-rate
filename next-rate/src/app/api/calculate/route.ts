/**
 * ============================================================================
 * API 名　：/api/calculate
 * 概要　　：未計算の対局結果に対して Elo レートの差分再計算を行う
 * 層区分　：Controller（計算ロジックは本 API 内で完結）
 *
 * 【本 API の目的】
 * ・追加／削除に伴うレートの不整合を解消する
 * ・差分再計算方式により、全件再計算を回避しつつ整合性を担保する
 *
 * 【削除対応のポイント】
 * ・削除された対局の影響を受けるのは「関係プレイヤーのみ」
 * ・境界（未計算の最初の対局）より前の対局のうち、
 *   関係プレイヤーが登場する対局のみを再計算して開始レートを復元する
 *
 * 【処理概要】
 * ① 全対局を playedAt 昇順で取得
 * ② 未計算の最初の対局（境界）を特定
 * ③ 全プレイヤーの初期レートを取得
 * ④ 未計算対局に登場するプレイヤー（関係プレイヤー）を抽出
 * ⑤ 境界より前の対局のうち、関係プレイヤーが登場する対局のみ再計算
 * ⑥ 境界以降（未計算）の対局を順次再計算
 * ⑦ Result / Player を一括更新（トランザクション）
 * ⑧ ★対局ゼロのプレイヤーを初期レートに戻す（今回追加）
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
 * ============================================================================
 */
export async function POST() {
  // ① 全対局を昇順で取得
  const allResults = await prisma.result.findMany({
    orderBy: { playedAt: "asc" },
  });

  // ② 未計算の最初の対局（境界）
  const startIndex = allResults.findIndex((r) => !r.isCalculated);
  if (startIndex === -1) {
    return NextResponse.json({ message: "全て計算済み" });
  }

  const targets = allResults.slice(startIndex);

  // ③ 全プレイヤーの初期レート
  const players = await prisma.player.findMany();
  const initialRateMap = new Map(players.map((p) => [p.id, p.initialRate]));

  // ④ 関係プレイヤー抽出
  const targetPlayerIds = new Set<string>();
  for (const m of targets) {
    targetPlayerIds.add(m.winnerId);
    targetPlayerIds.add(m.loserId);
  }

  // ⑤ 境界より前の開始レート復元
  const rateMap = new Map<string, number>();
  for (const pid of targetPlayerIds) {
    rateMap.set(pid, initialRateMap.get(pid)!);
  }

  for (const match of allResults.slice(0, startIndex)) {
    const { winnerId, loserId } = match;

    if (!rateMap.has(winnerId) && !rateMap.has(loserId)) continue;

    const winnerRate = rateMap.get(winnerId) ?? initialRateMap.get(winnerId)!;
    const loserRate = rateMap.get(loserId) ?? initialRateMap.get(loserId)!;

    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerRate,
      loserRate
    );

    rateMap.set(winnerId, newWinnerRate);
    rateMap.set(loserId, newLoserRate);
  }

  // ⑥ 未計算対局の Elo 計算
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

  // ⑦ DB 更新（Result / Player）
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

  /* ------------------------------------------------------------------------
   * ⑧ ★対局ゼロのプレイヤーを初期レートに戻す（今回追加）
   * ------------------------------------------------------------------------ */
  await prisma.$executeRawUnsafe(`
    UPDATE "Player"
    SET "currentRate" = "initialRate"
    WHERE id NOT IN (
      SELECT DISTINCT "winnerId" FROM "Result"
      UNION
      SELECT DISTINCT "loserId" FROM "Result"
    );
  `);

  return NextResponse.json({
    message: "差分計算完了（削除対応・開始レート完全復元・対局ゼロ初期化）",
    startIndex,
    updatedMatches: targets.length,
  });
}