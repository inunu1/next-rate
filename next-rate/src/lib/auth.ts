// src/lib/auth.ts
// ------------------------------------------------------------
// NextAuth 認証設定（Credentials 認証 + JWT セッション）
// - 認証：メールアドレス + パスワード
// - セッション：JWT 方式
// - コールバック：JWT / Session にユーザ情報 + 所属団体情報を付与
// ------------------------------------------------------------

import { getServerSession } from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  // ------------------------------------------------------------
  // 認証プロバイダ設定（Credentials 認証）
  // ------------------------------------------------------------
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      /**
       * 認証処理
       * - 入力されたメールアドレスでユーザを検索
       * - パスワードを検証
       * - 認証成功時は必要なユーザ情報を返却
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // ユーザ検索
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        // パスワード検証
        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!isValid) return null;

        // 認証成功 → JWT に格納する情報を返却
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole, // SaaS 全体の権限
        };
      },
    }),
  ],

  // ------------------------------------------------------------
  // セッション方式（JWT）
  // ------------------------------------------------------------
  session: {
    strategy: "jwt",
  },

  // ------------------------------------------------------------
  // コールバック設定
  // ------------------------------------------------------------
  callbacks: {
    /**
     * JWT 作成時のコールバック
     * - 認証成功時の user 情報を token に格納
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.systemRole = user.systemRole;
        token.name = user.name;
        token.email = user.email; // ★ email を追加
      }
      return token;
    },

    /**
     * セッション生成時のコールバック
     * - JWT の内容を session.user に反映
     * - 追加で Membership（所属団体情報）を付与
     */
    async session({ session, token }) {
      if (token?.id) {
        // 基本ユーザ情報
        session.user.id = token.id as string;
        session.user.systemRole = token.systemRole as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string | null;

        // ------------------------------------------------------------
        // 所属団体情報（Membership）を取得
        // ------------------------------------------------------------
        const memberships = await prisma.membership.findMany({
          where: { userId: token.id as string },
        });

        // session.user.organizations に格納
        session.user.organizations = memberships.map((m) => ({
          id: m.organizationId,
          role: m.role,
        }));
      }

      return session;
    },
  },
};

/**
 * 認証済みユーザ情報を取得するユーティリティ
 * - 未ログイン時は null を返却
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
