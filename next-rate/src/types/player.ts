/**
 * ============================================================================
 * 【ファイル名】
 * player.ts
 *
 * 【機能概要】
 * プレイヤー（Player）に関する型定義を集約する。
 * ============================================================================
 */

export type PostPlayerBody = {
  /** プレイヤー名（団体内でユニーク） */
  name: string;

  /** 初期レート */
  rate: number;

  /** owner のみ指定必須（admin は不要） */
  userId?: string;
};

export type DeletePlayerBody = {
  /** 削除対象プレイヤーの ID */
  id: string;

  /** owner のみ指定必須（admin は不要） */
  userId?: string;
};

/* ============================================================================
 * プレイヤー 1 件分の型（Prisma Player モデル準拠）
 * ============================================================================
 */
export type PlayerRecord = {
  id: string;
  name: string;
  initialRate: number;
  currentRate: number;
  userId: string;
  createdAt: Date;
  deletedAt: Date | null;
};

/* ============================================================================
 * GET /api/private/player のレスポンス型
 * ============================================================================
 */
export type PlayerListResponse = PlayerRecord[];
