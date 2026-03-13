/**
 * 【ファイル概要】
 * 本ファイルは NextAuth が内部で使用する型定義（Session / User / JWT）を、
 * アプリケーション固有の構造に合わせて拡張するための宣言ファイルである。
 *
 * 【必要性】
 * NextAuth のデフォルト型は最小構成であり、
 * session.user.id や token.id など、アプリ側で必須となる情報が定義されていない。
 * そのため、型安全性および IDE 補完を確保する目的で拡張を行う。
 *
 * 【適用範囲】
 * ・UI（useSession）で利用される Session 型
 * ・認証直後に扱われる User 型
 * ・middleware / API で利用される JWT 型
 *
 * 【効果】
 * ・session.user.id が型エラーにならない
 * ・token.id が middleware / API で安全に扱える
 * ・Prisma の User モデルとの整合性が向上する
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * 【Session 型拡張】
   * UI 側（Client Component）で useSession() により参照されるデータ構造。
   * JWT の内容が user にコピーされるため、JWT と同等のフィールドを定義する。
   */
  interface Session {
    user: {
      id: string;                 // アプリで必須となるユーザーID
      email?: string | null;      // 任意：メールアドレス
      name?: string | null;       // 任意：表示名
      image?: string | null;      // 任意：アイコン画像
    };
  }

  /**
   * 【User 型拡張】
   * 認証直後（authorize / callbacks.user）で扱われるユーザー情報。
   * Prisma の User モデルと整合性を取るために定義する。
   */
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  /**
   * 【JWT 型拡張】
   * middleware（getToken）や API（getServerSession）で参照される実体のトークン。
   * 認証判定やアクセス制御に利用するため、最低限のフィールドを定義する。
   */
  interface JWT {
    id: string;                   // 認証判定に利用するユーザーID
    email?: string | null;        // 任意：メールアドレス
    name?: string | null;         // 任意：表示名
  }
}