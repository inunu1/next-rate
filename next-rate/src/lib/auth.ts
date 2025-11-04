// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'ユーザー名', type: 'text' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        // 仮の認証ロジック（本番ではDB照合などに置き換え）
        if (credentials?.username === 'admin' && credentials?.password === 'pass') {
          return { id: '1', name: '管理者' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
};