/**
 * ============================================================
 * 【画面概要】
 * 管理ユーザー管理画面（/admin）の Server Component。
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・Client Component（AdminClient）の描画
 *
 * 【非責務】
 * ・DB アクセス（API に集約）
 * ・管理ユーザー一覧の取得（Client 側で API 呼び出し）
 * ・業務ロジック（API Route に集約）
 *
 * 【設計方針】
 * ・Server Component は「認証と初期レンダリング」のみに限定する
 * ・データ取得はすべて /api/private/admin に集約し、責務を明確化する
 * ・Players / Results と同一アーキテクチャで統一し、保守性を高める
 * ============================================================
 */

export const dynamic = 'force-dynamic';

import AdminClient from './UserClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  /* ------------------------------------------------------------
   * 認証チェック
   * ------------------------------------------------------------ */
  const session = await getServerSession(authOptions);

  // ▼ 未ログインの場合はログイン画面へ遷移
  if (!session?.user?.id) {
    redirect('/login');
  }

  // ▼ ログイン中ユーザーの ID（削除ボタンの制御などに使用）
  const currentUserId = session.user.id;

  /* ------------------------------------------------------------
   * Client Component の描画
   * ------------------------------------------------------------ */
  return <AdminClient currentUserId={currentUserId} />;
}