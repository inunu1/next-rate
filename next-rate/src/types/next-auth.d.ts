/**
 * ============================================================================
 * NextAuth 型拡張定義ファイル（2ロール構成 / 中間テーブルなし）
 *
 * 【目的】
 * 本アプリケーションで利用する認証情報（User / Session / JWT）を
 * NextAuth の型に適用し、型安全性と整合性を確保する。
 *
 * 【仕様】
 * ・systemRole = "owner" → SaaSオーナー
 * ・systemRole = "user"  → 団体オーナー
 *
 * 【Session.user の構造】
 * {
 *   id: string;
 *   email: string | null;
 *   name: string | null;
 *   systemRole: "owner" | "user";
 * }
 *
 * ※ 団体所属情報は保持しない（団体オーナー判定は organization.ownerId で行う）
 * ============================================================================
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      /** ログインユーザー識別子（Prisma.User.id） */
      id: string;

      /** SaaS 全体の権限（owner / user） */
      systemRole: string;

      /** 表示名（任意） */
      name?: string | null;

      /** メールアドレス（任意） */
      email?: string | null;

      /** アイコン画像（任意） */
      image?: string | null;
    };
  }

  interface User {
    id: string;
    systemRole: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    systemRole: string;
    email?: string | null;
    name?: string | null;
  }
}
