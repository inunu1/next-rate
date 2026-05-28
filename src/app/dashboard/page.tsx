/**
 * ============================================================================
 * 【画面概要】
 * ダッシュボード画面（/dashboard）の Server Component。
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・ユーザーのロール判定（owner / admin）
 * ・Client Component（DashboardClient）へ必要情報を渡す
 *
 * 【非責務】
 * ・DB アクセス（API に集約）
 * ・業務データの取得（Client 側で実施）
 *
 * 【設計方針】
 * ・Server Component は「認証」「ロール判定」のみ担当し、
 *   UI ロジックは Client Component に委譲する。
 * ============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  /* --------------------------------------------------------------------------
   * 認証チェック
   * ------------------------------------------------------------------------ */
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role as "owner" | "admin";

  /* --------------------------------------------------------------------------
   * Client Component の描画
   * ------------------------------------------------------------------------ */
  return <DashboardClient role={role} />;
}
