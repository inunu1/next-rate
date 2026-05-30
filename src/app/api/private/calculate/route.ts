/**
 * =============================================================================
 * @module        RatingCalculationBatch
 * @description   全対局データを基にした Elo レーティングのインメモリフル再計算、
 * および論理差分抽出に基づく安全な一括更新（バルクUPDATE）処理。
 * @version       2.0.0
 * @copyright     Internal System Architecture Standard 2026
 * =============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @constant    {number} K_FACTOR - Eloレーティング計算における変動重み係数（業務仕様書に準拠）
 */
const K_FACTOR = 32;

/**
 * @interface IEloCalculationResult
 * @description Elo計算結果の返却用データ構造定義
 */
interface IEloCalculationResult {
  newWinnerRate: number;
  newLoserRate: number;
}

/**
 * @function    calculateElo
 * @description 2名のプレイヤーレートを基に、理論上の期待勝率および対局後の新レートを算出する。
 * @param       {number} winnerRate - 勝者の対局直前レート
 * @param       {number} loserRate  - 敗者の対局直前レート
 * @returns     {IEloCalculationResult} 計算後の新レートオブジェクト
 */
function calculateElo(winnerRate: number, loserRate: number): IEloCalculationResult {
  const expectedWin = 1 / (1 + Math.pow(10, (loserRate - winnerRate) / 400));
  const expectedLose = 1 - expectedWin;

  return {
    newWinnerRate: Math.round(winnerRate + K_FACTOR * (1 - expectedWin)),
    newLoserRate: Math.round(loserRate + K_FACTOR * (0 - expectedLose)),
  };
}

/**
 * @function    POST
 * @description エントリポイント：フル再計算および論理差分一括更新処理
 * @returns     {Promise<NextResponse>} 処理結果メタデータを含むJSONレスポンス
 */
export async function POST(): Promise<NextResponse> {
  const getTimestamp = () => performance.now();
  const metrics: { label: string; ms: number }[] = [];
  const totalStartTime = getTimestamp();

  try {
    /* =========================================================================
     * フェーズ 1: データ一元フェッチ処理（通信回数の最適化・二重取得の排除）
     * =========================================================================
     */
    let sectionStartTime = getTimestamp();
    
    // ソート条件（時系列昇順）を指定し、Resultテーブルのマスターデータを一括取得
    const allResults = await prisma.result.findMany({
      orderBy: [
        { matchDate: "asc" },
        { roundIndex: "asc" },
      ],
    });
    // 同一コンテキスト内でPlayerテーブルの全データを一括取得
    const allPlayers = await prisma.player.findMany();
    
    metrics.push({ label: "phase1_fetch_db_data", ms: getTimestamp() - sectionStartTime });

    // メモリ上での O(1) 検索を実現するため、取得データを Map 構造へロード
    const oldResultMap = new Map(allResults.map(r => [r.id, r]));
    const oldPlayerMap = new Map(allPlayers.map(p => [p.id, p]));
    
    // 計算用ワークエリア：各プレイヤーの初期レート（initialRate）でマップを初期化
    const rateWorkMap = new Map(allPlayers.map(p => [p.id, p.initialRate]));

    /* =========================================================================
     * フェーズ 2: インメモリ Elo フル再計算（ロジック整合性の担保）
     * =========================================================================
     */
    sectionStartTime = getTimestamp();
    const calculatedResultArray: {
      id: string;
      winnerRate: number;
      loserRate: number;
    }[] = [];

    for (const match of allResults) {
      // プレイヤー削除等の例外を想定し、マスタ不在時は規定値（1500）へフォールバック（不具合対策）
      const currentWinnerRate = rateWorkMap.get(match.winnerId) ?? 1500;
      const currentLoserRate = rateWorkMap.get(match.loserId) ?? 1500;

      // 【仕様準拠】対局が実行される「直前」のスナップショットレートを配列へバインド
      calculatedResultArray.push({
        id: match.id,
        winnerRate: currentWinnerRate,
        loserRate: currentLoserRate,
      });

      // 次局計算用ワークエリアの更新処理
      const { newWinnerRate, newLoserRate } = calculateElo(currentWinnerRate, currentLoserRate);
      rateWorkMap.set(match.winnerId, newWinnerRate);
      rateWorkMap.set(match.loserId, newLoserRate);
    }
    metrics.push({ label: "phase2_elo_in_memory_loop", ms: getTimestamp() - sectionStartTime });

    /* =========================================================================
     * フェーズ 3: 論理差分抽出（更新レコードの限定によるDB負荷最小化）
     * =========================================================================
     */
    sectionStartTime = getTimestamp();
    
    // Resultテーブルに対する変更点の抽出
    const diffResults = calculatedResultArray.filter(calc => {
      const dbCurrent = oldResultMap.get(calc.id);
      return (
        !dbCurrent ||
        dbCurrent.winnerRate !== calc.winnerRate ||
        dbCurrent.loserRate !== calc.loserRate
      );
    });

    // Playerテーブルに対する変更点の抽出
    const diffPlayers = Array.from(rateWorkMap.entries()).filter(([id, calculatedRate]) => {
      const dbCurrent = oldPlayerMap.get(id);
      return !dbCurrent || dbCurrent.currentRate !== calculatedRate;
    });
    
    metrics.push({ label: "phase3_extract_logical_diffs", ms: getTimestamp() - sectionStartTime });

    /* =========================================================================
     * フェーズ 4: 安全な一括更新処理（SQLインジェクション対策の徹底）
     * =========================================================================
     */
    sectionStartTime = getTimestamp();
    
    if (diffResults.length > 0 || diffPlayers.length > 0) {
      // 型安全性を担保した更新クエリ・スタックの定義
      const transactionQueue: any[] = [];

      // Resultテーブル更新クエリのプッシュ
      diffResults.forEach(target => {
        transactionQueue.push(
          prisma.result.update({
            where: { id: target.id },
            data: {
              winnerRate: target.winnerRate,
              loserRate: target.loserRate,
            },
          })
        );
      });

      // Playerテーブル更新クエリのプッシュ
      diffPlayers.forEach(([targetId, nextRate]) => {
        transactionQueue.push(
          prisma.player.update({
            where: { id: targetId },
            data: {
              currentRate: nextRate,
            },
          })
        );
      });

      // Prisma内部の型安全なエスケープ機構を利用した一括トランザクション実行
      // ※注意：データ数が1万件を超える規模にスケールした場合はチャンク分割処理を要検討
      await prisma.$transaction(transactionQueue);
    }
    metrics.push({ label: "phase4_db_safe_bulk_update", ms: getTimestamp() - sectionStartTime });

    /* =========================================================================
     * フェーズ 5: レスポンス返却処理
     * =========================================================================
     */
    metrics.push({ label: "total_execution_time", ms: getTimestamp() - totalStartTime });

    return NextResponse.json({
      status: "SUCCESS",
      message: "正常終了：全件再計算および論理差分一括更新処理が完了しました。",
      statistics: {
        totalProcessedMatches: allResults.length,
        logicalDiffResultCount: diffResults.length,
        logicalDiffPlayerCount: diffPlayers.length,
      },
      performanceMetrics: metrics,
    });

  } catch (error: any) {
    // 例外発生時の共通ハンドリング（ログ出力およびシステムエラー応答）
    console.error("[FATAL ERROR] API-PRI-001 実行中にシステム例外を検知しました。");
    console.error(error);

    return NextResponse.json(
      {
        status: "ERROR",
        errorCode: "ERR-SYS-500",
        message: "致命的なシステムエラーが発生しました。システム管理者に連絡してください。",
        errorDetails: error?.message ?? "Unknown exception",
      },
      { status: 500 }
    );
  }
}