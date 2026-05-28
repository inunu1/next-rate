/**
 * ============================================================================
 * 【ファイル名】
 * result.ts
 *
 * 【機能概要】
 * 対局結果（Result）に関する型定義を集約する。
 *
 * 【役割】
 * - Result API（/api/private/result）の Request / Response 型を提供
 * - フロント・API・サービス層で共通利用する型を一元管理
 *
 * 【設計方針】
 * - API 層に型を埋め込まず、本ファイルに集約して保守性を向上
 * - SIer 風に「業務仕様が読み取れるコメント」を付与
 * ============================================================================
 */

/* ============================================================================
 * POST /api/private/result のリクエストボディ
 *
 * 【業務仕様】
 * - 1 対局（1 ラウンド）の結果を登録する
 * - winner / loser のレートは登録時点の値を保存（履歴保持）
 * - matchDate は YYYYMMDD（数値）
 * - roundIndex は同一日の対局順（0,1,2,...）
 * - userId は owner のみ指定必須（admin は自分の userId 固定）
 * ============================================================================
 */
export type PostResultBody = {
  /** 勝者のプレイヤーID */
  winnerId: string;

  /** 勝者の名前（履歴保持用） */
  winnerName: string;

  /** 勝者の対局前レート */
  winnerRate: number;

  /** 敗者のプレイヤーID */
  loserId: string;

  /** 敗者の名前（履歴保持用） */
  loserName: string;

  /** 敗者の対局前レート */
  loserRate: number;

  /** 対局日（YYYYMMDD 数値） */
  matchDate: number;

  /** 同一日の対局順（0,1,2,...） */
  roundIndex: number;

  /** owner のみ指定必須（admin は不要） */
  userId?: string;
};

/* ============================================================================
 * GET /api/private/result のレスポンス型
 *
 * 【業務仕様】
 * - 指定日の対局結果一覧を返却
 * - 前日 / 翌日の存在チェックも含む
 * - date / prevDate / nextDate は YYYY-MM-DD の文字列形式
 * ============================================================================
 */
export type ResultSearchResponse = {
  /** 対象日（YYYY-MM-DD） */
  date: string | null;

  /** 前日（存在しない場合 null） */
  prevDate: string | null;

  /** 翌日（存在しない場合 null） */
  nextDate: string | null;

  /** 対局結果一覧 */
  results: ResultRecord[];
};

/* ============================================================================
 * 対局結果 1 件分の型
 *
 * 【備考】
 * - Prisma の Result モデルをそのまま返すが、
 *   API 層で Pick して利用する場合に備えて定義
 * ============================================================================
 */
export type ResultRecord = {
  id: string;
  winnerId: string;
  winnerName: string;
  winnerRate: number;
  loserId: string;
  loserName: string;
  loserRate: number;
  matchDate: number;
  roundIndex: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

/* ============================================================================
 * DELETE /api/private/result のクエリパラメータ
 *
 * 【業務仕様】
 * - id: 削除対象の対局結果ID
 * - userId: owner のみ指定必須（admin は不要）
 * ============================================================================
 */
export type DeleteResultQuery = {
  id: string;
  userId?: string;
};
