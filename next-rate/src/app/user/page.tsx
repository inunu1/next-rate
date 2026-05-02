/**
 * ============================================================================
 * 【画面概要】
 * 団体管理画面（/user）の Server Component。
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・owner（SaaS 運営者）以外は /dashboard へリダイレクト
 * ・Client Component（UserClient）の描画
 *
 * 【非責務】
 * ・DB アクセス（API に集約）
 * ・団体一覧の取得（Client 側で API 呼び出し）
 * ・業務ロジック（API Route に集約）
 * ============================================================================
 */

export const dynamic = "force-dynamic";

import UserClient from "./UserClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserPage() {
  /* ------------------------------------------------------------
   * 認証チェック
   * ------------------------------------------------------------ */
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  /* ------------------------------------------------------------
   * ロールチェック（owner 専用）
   * ------------------------------------------------------------ */
  if (session.user.role !== "owner") {
    redirect("/dashboard");
  }

  /* ------------------------------------------------------------
   * Client Component の描画
   * ------------------------------------------------------------ */
  return <UserClient currentUserId={session.user.id} />;
}
