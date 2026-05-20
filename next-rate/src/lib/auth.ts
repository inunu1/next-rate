/**
 * ============================================================================
 * NextAuth 設定（2ロール構成 / 中間テーブルなし）
 *
 * 【仕様】
 * ・systemRole = "owner" → SaaSオーナー
 * ・systemRole = "user"  → 団体オーナー
 *
 * 【セッション構造】
 * session.user = {
 *   id: string;
 *   email: string | null;
 *   name: string | null;
 *   systemRole: "owner" | "user";
 * }
 *
 * ※ 団体所属情報は保持しない（団体オーナーは organization.ownerId で判定）
 * ============================================================================
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      /**
       * 認証処理
       * - email でユーザー検索
       * - パスワード検証
       * - 認証成功時は必要な情報のみ返却
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole, // "owner" | "user"
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * JWT 作成時
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.systemRole = user.systemRole;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    /**
     * セッション生成時
     */
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.systemRole = token.systemRole as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string | null;

      // ★ 団体所属情報は保持しない（中間テーブル廃止）
      // session.user.organizations = [];

      return session;
    },
  },
};
