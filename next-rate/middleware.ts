// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuth = !!token;
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * ログインページ以外すべてのページで認証を要求する
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
