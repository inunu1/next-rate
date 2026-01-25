// middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const isAuth = !!token
  const isLoginPage = req.nextUrl.pathname === '/login'

  // 未ログインで login 以外のページに来たらリダイレクト
  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // API を完全除外し、ページだけ保護する
    '/((?!api/).*)',
  ],
}