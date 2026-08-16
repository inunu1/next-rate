/**
 * ============================================================================
 * 【ファイル名】
 * user.ts
 *
 * 【機能概要】
 * 団体ユーザー（User）に関する型定義を集約する。
 * ============================================================================
 */

/* ============================================================================
 * ロール種別（User.role）
 * ============================================================================
 */
export type UserRole = "owner" | "admin" | "editer" | "viewer";

export type UserOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  organizationId?: string | null;
};

/* ============================================================================
 * POST /api/private/user のリクエストボディ
 * ============================================================================
 */
export type PostUserBody = {
  /** ユーザー名（表示名） */
  name: string;

  /** ログイン用メールアドレス（ユニーク） */
  email: string;

  /** 平文パスワード（API 内でハッシュ化） */
  password: string;

  /** ロール（owner / admin） */
  role: UserRole;

  /** 所属団体 ID（admin 登録時に紐づけ） */
  organizationId?: string | null;
};

/* ============================================================================
 * DELETE /api/private/user のリクエストボディ
 * ============================================================================
 */
export type DeleteUserBody = {
  /** 削除対象ユーザーの ID */
  id: string;
};

/* ============================================================================
 * User 一覧取得（GET /api/private/user）のレスポンス型
 *
 * 【備考】
 * - Prisma の User モデルに完全準拠
 * ============================================================================
 */
export type UserListResponse = {
  id: string;
  email: string;
  name: string | null;
  hashedPassword: string;
  role: UserRole;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}[];
