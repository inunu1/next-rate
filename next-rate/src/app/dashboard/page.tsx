/**
 * ============================================================================
 * 【画面概要】
 * ダッシュボード画面（/dashboard）の Server Component（2ロール構成）
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・ユーザーのロール判定（saasOwner / orgOwner）
 * ・Client Component（DashboardClient）へ role を渡す
 *
 * 【ロール判定仕様】
 * ・systemRole = "owner" → SaaSオーナー
 * ・systemRole = "user"  → 団体オーナー
 * ============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  /* --------------------------------------------------------------------------
   * 認証チェック
   * ------------------------------------------------------------------------ */
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  /* --------------------------------------------------------------------------
   * ロール判定（2ロール構成）
   * ------------------------------------------------------------------------ */
  let role: "saasOwner" | "orgOwner" = "orgOwner";

  // SaaSオーナー
  if (session.user.systemRole === "owner") {
    role = "saasOwner";
  } else {
    // 団体オーナーか確認（ownerId が自分の団体を持っているか）
    const org = await prisma.organization.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!org) {
      // 団体を持っていない user はダッシュボードを利用できない
      return <div>所属団体がありません。</div>;
    }

    role = "orgOwner";
  }

  /* --------------------------------------------------------------------------
   * Client Component の描画
   * ------------------------------------------------------------------------ */
  return <DashboardClient role={role} />;
}
