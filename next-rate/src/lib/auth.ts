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
        // 仮の認証ロジック
        if (credentials?.username === 'admin' && credentials?.password === 'pass') {
          return { id: '1', name: '管理者', email: 'admin@example.com' };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt', // ✅ ここがJWTを有効にする設定
  },
  pages: {
    signIn: '/login',
  },
};