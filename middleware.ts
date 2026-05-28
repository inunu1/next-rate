/**
 * 【機能概要】
 * 本 middleware は、Next.js アプリケーション全体のアクセス制御を行う。
 * 以下の 2 種類のリソースを対象とする。
 *
 * ① 認証が必要なページ（/dashboard, /players, /results, /settings）
 * ② 認証が必要な API（/api/*）
 *
 * ただし、公開 API（/api/public/*）は認証不要とする。
 *
 * 【処理概要】
 * ・JWT トークンの有無により認証状態を判定する
 * ・未認証ユーザーが保護対象へアクセスした場合、/login へリダイレクトする
 * ・公開 API は例外としてそのまま通過させる
 *
 * 【例外処理方針】
 * ・middleware 内では例外を投げず、全て NextResponse で制御する
 * ・ログインページへのアクセスは常に許可する
 */

import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const isAuth = !!token
  const pathname = req.nextUrl.pathname

  /* ------------------------------------------------------------
   * ① ログインページは常に許可
   * ------------------------------------------------------------ */
  const isLoginPage = pathname === '/login'
  if (isLoginPage) {
    return NextResponse.next()
  }

  /* ------------------------------------------------------------
   * ② 公開 API（/api/public/*）は認証不要
   * ------------------------------------------------------------ */
  const isPublicApi = pathname.startsWith('/api/public')
  if (isPublicApi) {
    return NextResponse.next()
  }

  /* ------------------------------------------------------------
   * ③ 認証が必要なリソースの判定
   * ------------------------------------------------------------ */
  const needsAuth =
    pathname.startsWith('/api') ||          // REST API 全体を保護
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/players') ||
    pathname.startsWith('/results') ||
    pathname.startsWith('/settings')

  /* ------------------------------------------------------------
   * ④ 未認証ユーザーのアクセス制御
   * ------------------------------------------------------------ */
  if (needsAuth && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  /* ------------------------------------------------------------
   * ⑤ 認証済みユーザーはそのまま通過
   * ------------------------------------------------------------ */
  return NextResponse.next()
}

/**
 * 【matcher 設定】
 * ・middleware を適用するパスを明示的に定義
 * ・/api/* を含めることで REST API も保護対象とする
 */
export const config = {
  matcher: [
    '/api/:path*',        // ★ API 全体を保護
    '/dashboard/:path*',
    '/players/:path*',
    '/results/:path*',
    '/settings/:path*',
    '/login',
  ],
}