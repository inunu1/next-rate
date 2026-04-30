// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

/**
 * NextAuth 設定
 * - 認証方式：Credentials（メールアドレス + パスワード）
 * - セッション方式：JWT
 * - コールバック：JWT / Session にユーザ情報を付与
 */
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
       * - 入力されたメールアドレスでユーザを検索
       * - パスワードを検証
       * - 認証成功時は必要なユーザ情報を返却
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        // ★ role を含めて返却（session に載せるため）
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * JWT 作成時のコールバック
     * - 認証成功時の user 情報を token に格納
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },

    /**
     * セッション生成時のコールバック
     * - JWT の内容を session.user に反映
     */
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
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
