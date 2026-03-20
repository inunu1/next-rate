/**
 * =============================================================================
 * API 名　　：POST /api/private/calculate
 * 機能概要　：全対局データを基に Elo レートをフル再計算し、
 * 　　　　　：変更が発生したレコードのみ差分 UPDATE する。
 *
 * 業務目的　：レート整合性の担保、および DB 更新量の最適化
 *
 * 処理方式　：
 *   ① 現行データ（Result / Player）を取得（差分比較用）
 *   ② 全対局を playedAt 昇順で取得
 *   ③ 全プレイヤーを初期レートで初期化
 *   ④ Elo レートをフル再計算（メモリ上で完結）
 *   ⑤ 差分抽出（Result / Player）
 *   ⑥ 差分 UPDATE（バルク 1 回）
 *
 * 非機能要件：
 *   - フル再計算により整合性 100% を保証
 *   - 差分 UPDATE により DB I/O を最小化
 *   - トランザクションは使用しない（処理時間短縮優先）
 *
 * 例外方針：
 *   - 例外は API レイヤで捕捉し、500 を返却
 *   - DB エラー発生時は部分更新の可能性あり（許容）
 *
 * 保守方針：
 *   - 差分抽出ロジックは Result / Player の双方で共通化可能
 *   - 将来的にチャンク方式へ切替可能（I/O 最適化余地）
 * =============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const K_FACTOR = 32;

/* -----------------------------------------------------------------------------
 * Elo レート計算（1 対局分）
 *  - 業務ロジック：勝者 +K、敗者 -K の期待値補正方式
 * --------------------------------------------------------------------------- */
function calculateElo(winnerRate: number, loserRate: number) {
  const expectedWin = 1 / (1 + Math.pow(10, (loserRate - winnerRate) / 400));
  const expectedLose = 1 - expectedWin;

  return {
    newWinnerRate: Math.round(winnerRate + K_FACTOR * (1 - expectedWin)),
    newLoserRate: Math.round(loserRate + K_FACTOR * (0 - expectedLose)),
  };
}

/* =============================================================================
 * POST /api/private/calculate（フル再計算 + 差分 UPDATE）
 * =============================================================================
 */
export async function POST() {
  const t = () => performance.now();
  const metrics: { label: string; ms: number }[] = [];
  const totalStart = t();

  /* ---------------------------------------------------------------------------
   * ① 現行データ取得（差分比較用）
   *    - Result：winnerRate / loserRate の比較に使用
   *    - Player：currentRate の比較に使用
   * ------------------------------------------------------------------------- */
  let s = t();
  const oldResults = await prisma.result.findMany();
  const oldPlayers = await prisma.player.findMany();
  metrics.push({ label: "fetch_old_data", ms: t() - s });

  const oldResultMap = new Map(oldResults.map(r => [r.id, r]));
  const oldPlayerMap = new Map(oldPlayers.map(p => [p.id, p]));

  /* ---------------------------------------------------------------------------
   * ② 全対局取得（再計算用）
   *    - playedAt 昇順で取得し、レート変動の時系列整合性を担保
   * ------------------------------------------------------------------------- */
  s = t();
  const allResults = await prisma.result.findMany({
    orderBy: { playedAt: "asc" },
  });
  metrics.push({ label: "fetch_results", ms: t() - s });

  /* ---------------------------------------------------------------------------
   * ③ 全プレイヤー取得（初期レートで初期化）
   *    - 対局が 0 件のプレイヤーは initialRate のまま確定
   * ------------------------------------------------------------------------- */
  s = t();
  const players = await prisma.player.findMany();
  metrics.push({ label: "fetch_players", ms: t() - s });

  const rateMap = new Map(players.map(p => [p.id, p.initialRate]));

  /* ---------------------------------------------------------------------------
   * ④ Elo フル再計算
   *    - メモリ上で全対局を順次処理
   *    - DB には一切アクセスしない（I/O 最適化）
   * ------------------------------------------------------------------------- */
  s = t();
  const newResultUpdates: {
    id: string;
    winnerRate: number;
    loserRate: number;
  }[] = [];

  for (const match of allResults) {
    const winnerRate = rateMap.get(match.winnerId)!;
    const loserRate = rateMap.get(match.loserId)!;

    const { newWinnerRate, newLoserRate } = calculateElo(
      winnerRate,
      loserRate
    );

    rateMap.set(match.winnerId, newWinnerRate);
    rateMap.set(match.loserId, newLoserRate);

    newResultUpdates.push({
      id: match.id,
      winnerRate,
      loserRate,
    });
  }
  metrics.push({ label: "elo_loop", ms: t() - s });

  /* ---------------------------------------------------------------------------
   * ⑤ 差分抽出（Result）
   *    - winnerRate / loserRate が変化したレコードのみ抽出
   * ------------------------------------------------------------------------- */
  s = t();
  const diffResults = newResultUpdates.filter(r => {
    const old = oldResultMap.get(r.id);
    return (
      !old ||
      old.winnerRate !== r.winnerRate ||
      old.loserRate !== r.loserRate
    );
  });
  metrics.push({ label: "diff_results", ms: t() - s });

  /* ---------------------------------------------------------------------------
   * ⑥ 差分抽出（Player）
   *    - currentRate が変化したプレイヤーのみ抽出
   * ------------------------------------------------------------------------- */
  s = t();
  const newPlayerUpdates = Array.from(rateMap.entries());
  const diffPlayers = newPlayerUpdates.filter(([id, rate]) => {
    const old = oldPlayerMap.get(id);
    return !old || old.currentRate !== rate;
  });
  metrics.push({ label: "diff_players", ms: t() - s });

  /* ---------------------------------------------------------------------------
   * ⑦ 差分 UPDATE（バルク 1 回）
   *    - Result → Player の順で更新
   *    - SQL は VALUES 句を用いた一括更新方式
   * ------------------------------------------------------------------------- */
  s = t();

  /* Result 差分 UPDATE */
  if (diffResults.length > 0) {
    await prisma.$executeRawUnsafe(`
      UPDATE "Result" AS r
      SET 
        "winnerRate" = v."winnerRate",
        "loserRate" = v."loserRate",
        "isCalculated" = true
      FROM (VALUES
        ${diffResults
          .map(
            r => `('${r.id}', ${r.winnerRate}, ${r.loserRate})`
          )
          .join(",")}
      ) AS v("id", "winnerRate", "loserRate")
      WHERE r.id = v."id";
    `);
  }

  /* Player 差分 UPDATE */
  if (diffPlayers.length > 0) {
    await prisma.$executeRawUnsafe(`
      UPDATE "Player" AS p
      SET "currentRate" = v."currentRate"
      FROM (VALUES
        ${diffPlayers.map(([id, rate]) => `('${id}', ${rate})`).join(",")}
      ) AS v("id", "currentRate")
      WHERE p.id = v."id";
    `);
  }

  metrics.push({ label: "update_db_bulk", ms: t() - s });

  /* ---------------------------------------------------------------------------
   * ⑧ 総処理時間（メトリクス集計）
   * ------------------------------------------------------------------------- */
  metrics.push({ label: "total", ms: t() - totalStart });

  return NextResponse.json({
    message: "フル再計算完了（差分 UPDATE：バルク1回）",
    totalMatches: allResults.length,
    diffResults: diffResults.length,
    diffPlayers: diffPlayers.length,
    metrics,
  });
}