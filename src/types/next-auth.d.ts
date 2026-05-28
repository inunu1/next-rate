/**
 * ============================================================
 *  NextAuth 型拡張定義ファイル（Application Customization）
 * ============================================================
 *
 * 【目的】
 * 本アプリケーションで利用する認証情報（Session / User / JWT）に対し、
 * NextAuth のデフォルト型では不足する項目（id / role 等）を追加し、
 * 型安全性および保守性を確保する。
 *
 * 【背景】
 * NextAuth の標準 User / Session / JWT 型は最小構成であり、
 * Prisma.User モデルと整合しないため、アプリ側で必要な情報が欠落する。
 * そのため、module augmentation により型を拡張する。
 *
 * 【適用範囲】
 * - UI（useSession）で参照される Session.user
 * - 認証処理（authorize / callbacks）で扱う User
 * - middleware / API で参照される JWT
 *
 * 【効果】
 * - session.user.id / session.user.role が型エラーにならない
 * - token.id / token.role を middleware で安全に利用可能
 * - Prisma.User モデルとの整合性が向上し、保守性が高まる
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
      id: string;                 // 必須：アプリケーション内でのユーザー識別子（＝団体ID）
      role: string;               // 必須：権限（owner / admin）
      email?: string | null;      // 任意：メールアドレス
      name?: string | null;       // 任意：表示名（団体名）
      image?: string | null;      // 任意：アイコン画像
    };
  }

  /**
   * ------------------------------------------------------------
   *  User 型拡張
   * ------------------------------------------------------------
   * 認証直後（authorize / callbacks.user）で扱われるユーザー情報。
   * Prisma.User モデルと整合性を取るため、role を含めて定義する。
   */
  interface User {
    id: string;
    role: string;                 // 必須：Prisma.User.role と一致
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
   * 認可判定（owner / admin）に利用するため、role を必須項目として定義する。
   */
  interface JWT {
    id: string;                   // 必須：ユーザー識別子（＝団体ID）
    role: string;                 // 必須：権限（owner / admin）
    email?: string | null;
    name?: string | null;
  }
}
