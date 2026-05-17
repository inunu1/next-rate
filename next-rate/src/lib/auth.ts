// ============================================================================
// NextAuth 認証設定（Credentials 認証 + JWT セッション）
// ----------------------------------------------------------------------------
// ・認証方式：メールアドレス + パスワード
// ・セッション方式：JWT
// ・コールバック：JWT / Session にユーザ情報 + 所属団体情報を付与
// ・Membership.role を union 型（"owner" | "editor" | "viewer"）として返却
//   → next-auth.d.ts と完全整合
// ============================================================================

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

// ============================================================================
// NextAuth 設定本体
// ============================================================================
export const authOptions: NextAuthOptions = {
  // --------------------------------------------------------------------------
  // 認証プロバイダ設定（Credentials 認証）
  // --------------------------------------------------------------------------
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
       * - 認証成功時は JWT に格納するユーザ情報を返却
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.warn("authorize failed: missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          console.warn("authorize failed: user not found", credentials.email);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!isValid) {
          console.warn("authorize failed: invalid password", credentials.email);
          return null;
        }

        // 認証成功 → JWT に格納する情報
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole,
        };
      },
    }),
  ],

  // --------------------------------------------------------------------------
  // セッション方式（JWT）
  // --------------------------------------------------------------------------
  session: {
    strategy: "jwt",
  },

  // --------------------------------------------------------------------------
  // コールバック設定
  // --------------------------------------------------------------------------
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
        token.email = user.email;
      }
      return token;
    },

    /**
     * セッション生成時のコールバック
     * - JWT の内容を session.user に反映
     * - Membership（所属団体情報）を付与
     * - role を union 型にキャスト（最重要）
     */
    async session({ session, token }) {
      if (!session.user) session.user = {} as any;

      // 基本ユーザ情報
      session.user.id = token.id as string;
      session.user.systemRole = token.systemRole as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string | null;

      // ----------------------------------------------------------------------
      // 所属団体情報（Membership）を取得
      // ----------------------------------------------------------------------
      const memberships = await prisma.membership.findMany({
        where: { userId: token.id as string },
      });

      // ----------------------------------------------------------------------
      // ★ role を union 型として返却（TS2345 の根本原因を解消）
      // ----------------------------------------------------------------------
      session.user.organizations = memberships.map((m) => ({
        id: m.organizationId,
        role: m.role as "owner" | "editor" | "viewer",
      }));

      return session;
    },
  },
};

// ============================================================================
// 認証済みユーザ情報を取得するユーティリティ
// ============================================================================
import { getServerSession } from "next-auth";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
