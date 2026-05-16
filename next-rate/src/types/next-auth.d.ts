/**
 * ============================================================
 *  NextAuth 型拡張定義ファイル（Application Customization）
 * ============================================================
 *
 * 【目的】
 * 本アプリケーションで利用する認証情報（Session / User / JWT）に対し、
 * NextAuth のデフォルト型では不足する項目（id / systemRole / organizations 等）を追加し、
 * 型安全性および保守性を確保する。
 *
 * 【背景】
 * NextAuth の標準 User / Session / JWT 型は最小構成であり、
 * Prisma.User モデルおよび Membership モデルと整合しないため、
 * アプリ側で必要な情報が欠落する。
 *
 * 【適用範囲】
 * - UI（useSession）で参照される Session.user
 * - 認証処理（authorize / callbacks）で扱う User
 * - middleware / API で参照される JWT
 *
 * 【効果】
 * - session.user.id / session.user.systemRole が型エラーにならない
 * - session.user.organizations[] に団体情報を安全に格納可能
 * - token.id / token.systemRole を middleware で安全に利用可能
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * ------------------------------------------------------------
   *  Session 型拡張
   * ------------------------------------------------------------
   * UI（Client Component）で useSession() により参照されるデータ構造。
   * JWT の内容が user にコピーされるため、JWT と同等のフィールドを定義する。
   */
  interface Session {
    user: {
      id: string;                 // ログインユーザーの識別子（User.id）
      systemRole: string;         // SaaS 全体の権限（admin / user）
      // 既存コードとの互換性のためのエイリアス
      role?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;

      /**
       * 所属団体情報（Membership）
       * - id: Organization.id
       * - role: 団体内の権限（owner / editor / viewer）
       */
      organizations: {
        id: string;
        role: string;
      }[];
    };
  }

  /**
   * ------------------------------------------------------------
   *  User 型拡張
   * ------------------------------------------------------------
   * 認証直後（authorize / callbacks.user）で扱われるユーザー情報。
   * Prisma.User モデルと整合性を取るため、systemRole を含めて定義する。
   */
  interface User {
    id: string;
    systemRole: string;           // Prisma.User.systemRole と一致
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * ------------------------------------------------------------
   *  JWT 型拡張
   * ------------------------------------------------------------
   * middleware（getToken）や API（getServerSession）で参照されるトークン。
   * 認可判定に利用するため、systemRole を必須項目として定義する。
   */
  interface JWT {
    id: string;                   // ログインユーザーの識別子
    systemRole: string;           // SaaS 全体の権限
    email?: string | null;
    name?: string | null;
  }
}
