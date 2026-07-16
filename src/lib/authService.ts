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
 * - ロール（admin / owner）に基づく操作対象 organizationId の決定
 *   （resolveTargetOrganizationId）
 * - owner 専用 API の権限チェック（requireOwner）
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

  if (!session?.user) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  return { session };
}

/* ============================================================================
 * owner 専用チェック（requireOwner）
 *
 * 【仕様】
 * - 認証済みであること（requireAuth を内包）
 * - user.role が owner の場合のみ成功
 *
 * 【返却仕様】
 * - 正常: { session }
 * - 異常: { error, status }
 * ============================================================================
 */
export async function requireOwner(): Promise<AuthResult> {
  const auth = await requireAuth();

  if ("error" in auth) {
    return auth; // Unauthorized
  }

  const session = auth.session;

  if (session.user.role !== "owner") {
    return {
      error: "権限がありません（owner のみ利用可能）",
      status: 403,
    };
  }

  return { session };
}

/* ============================================================================
 * 操作対象 organizationId の決定（resolveTargetOrganizationId）
 *
 * 【ロール仕様】
 * - admin:
 *     - 常に自分自身の organizationId を使用（他団体操作不可）
 * - owner:
 *     - クエリ or ボディで organizationId の指定が必須
 *
 * 【返却仕様】
 * - 正常: organizationId（string）
 * - 異常: { error, status }
 * ============================================================================
 */
export function resolveTargetOrganizationId(
  session: Session,
  organizationIdParam: string | null
): string | AuthError {
  const role = session.user.role;

  if (role === "admin") {
    return session.user.organizationId ?? session.user.id;
  }

  if (!organizationIdParam) {
    return {
      error: "organizationId が指定されていません（owner のみ必須）",
      status: 400,
    };
  }

  return organizationIdParam;
}
