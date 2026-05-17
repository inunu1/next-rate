/**
 * ============================================================================
 * NextAuth 型拡張定義ファイル（SIer 風・完全版）
 * ============================================================================
 *
 * 【目的】
 * 本アプリケーションの認証情報構造（User / Session / JWT）を NextAuth に適用し、
 * 型安全性・保守性・整合性を確保する。
 *
 * 【重要ポイント】
 * - organizations を「必須」にする（undefined を許容しない）
 * - organizations[].role を union 型に限定（owner / editor / viewer）
 * - API 層で undefined が発生しない構造を保証
 * ============================================================================
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * --------------------------------------------------------------------------
   * Session 型拡張
   * --------------------------------------------------------------------------
   * UI（useSession）および API（getServerSession）で参照される認証情報。
   * JWT の内容が user にコピーされるため、JWT と同等のフィールドを定義する。
   */
  interface Session {
    user: {
      /** ログインユーザー識別子（Prisma.User.id） */
      id: string;

      /** SaaS 全体の権限（admin / user） */
      systemRole: string;

      /** 既存コード互換用（任意） */
      role?: string;

      email?: string | null;
      name?: string | null;
      image?: string | null;

      /**
       * 所属団体情報（Membership）
       * - id: Organization.id
       * - role: 団体内権限（owner / editor / viewer）
       *
       * ※必須項目として定義することで、
       *   API 層で undefined が発生しない構造を保証する。
       */
      organizations: {
        id: string;
        role: "owner" | "editor" | "viewer";
      }[];
    };
  }

  /**
   * --------------------------------------------------------------------------
   * User 型拡張
   * --------------------------------------------------------------------------
   * 認証直後（authorize / callbacks.user）で扱われるユーザー情報。
   * Prisma.User モデルと整合性を取る。
   */
  interface User {
    id: string;
    systemRole: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * --------------------------------------------------------------------------
   * JWT 型拡張
   * --------------------------------------------------------------------------
   * middleware（getToken）や API（getServerSession）で参照されるトークン。
   * 認可判定に利用するため、systemRole を必須項目として定義する。
   */
  interface JWT {
    id: string;
    systemRole: string;
    email?: string | null;
    name?: string | null;
  }
}
