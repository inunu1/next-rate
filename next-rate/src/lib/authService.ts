/**
 * ============================================================================
 * 【ファイル名】
 * authService.ts
 *
 * 【機能概要】
 * 認証（Authentication）および認可（Authorization）に関する
 * 共通サービス関数を提供する。
 *
 * 【役割】
 * - next-auth を用いた認証チェック（requireAuth）
 * - ロール（admin / owner）に基づく操作対象 userId の決定
 *   （resolveTargetUserId）
 *
 * 【利用箇所】
 * - private API 全般（/api/private/...）
 *
 * 【設計方針】
 * - API 層は薄くし、本ファイルの関数を呼び出すだけにする
 * - 認証・認可ロジックを一元化し、保守性を高める
 * ============================================================================
 */

import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ============================================================================
 * 型定義
 * ============================================================================ */

/** 認証成功時の返却型 */
export type AuthSuccess = { session: Session };

/** 認証失敗時の返却型 */
export type AuthError = { error: string; status: number };

/** 認証結果の総称型 */
export type AuthResult = AuthSuccess | AuthError;

/* ============================================================================
 * 認証チェック（requireAuth）
 *  - next-auth のセッションを取得し、未認証なら 401 を返す
 *  - API 層での認証処理を共通化
 * ============================================================================
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  // ------------------------------------------------------------
  // 認証失敗（セッションなし）
  // ------------------------------------------------------------
  if (!session?.user) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  // ------------------------------------------------------------
  // 認証成功
  // ------------------------------------------------------------
  return { session };
}

/* ============================================================================
 * 操作対象 userId の決定（resolveTargetUserId）
 *
 * 【ロール仕様】
 * - admin:
 *     - 常に自分自身の userId を使用（他団体操作不可）
 * - owner:
 *     - クエリ or ボディで userId の指定が必須
 *
 * 【返却仕様】
 * - 正常: userId（string）
 * - 異常: { error, status }
 * ============================================================================
 */
export function resolveTargetUserId(
  session: Session,
  userIdParam: string | null
): string | AuthError {
  const role = session.user.role;

  // ------------------------------------------------------------
  // admin → 自分自身の userId 固定
  // ------------------------------------------------------------
  if (role === "admin") {
    return session.user.id;
  }

  // ------------------------------------------------------------
  // owner → userId の指定が必須
  // ------------------------------------------------------------
  if (!userIdParam) {
    return {
      error: "userId が指定されていません（owner のみ必須）",
      status: 400,
    };
  }

  // ------------------------------------------------------------
  // 正常（owner が userId を指定したケース）
  // ------------------------------------------------------------
  return userIdParam;
}
