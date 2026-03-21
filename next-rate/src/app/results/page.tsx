/**
 * ============================================================
 * 【画面概要】
 * 対局結果管理画面（/results）の Server Component。
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・Client Component（ResultsClient）の描画
 *
 * 【非責務】
 * ・DB アクセス（API に集約）
 * ・プレイヤー一覧の取得（Client 側で API 呼び出し）
 * ・対局結果の取得（Client 側で API 呼び出し）
 *
 * 【設計方針】
 * ・Server Component は認証と初期レンダリングのみ担当し、
 *   データ取得はすべて API に集約することで責務を明確化する。
 * ============================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ResultsClient from './ResultsClient';

export default async function ResultsPage() {
  /* ------------------------------------------------------------
   * 認証チェック
   * ------------------------------------------------------------ */
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  /* ------------------------------------------------------------
   * Client Component の描画
   * ------------------------------------------------------------ */
  return <ResultsClient />;
}