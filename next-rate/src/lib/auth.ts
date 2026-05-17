/**
 * ============================================================================
 * NextAuth 設定（SIer 風・完全版）
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
          systemRole: user.systemRole,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.systemRole = user.systemRole;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.systemRole = token.systemRole as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string | null;

      const memberships = await prisma.membership.findMany({
        where: { userId: token.id as string },
      });

      session.user.organizations = memberships.map((m) => ({
        id: m.organizationId,
        role: m.role as "owner" | "editor" | "viewer",
      }));

      return session;
    },
  },
};
