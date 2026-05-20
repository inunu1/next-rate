/**
 * ============================================================================
 * 対局結果管理画面（/results）Server Component（2ロール構成）
 *
 * 【責務】
 * ・認証チェック
 * ・ユーザーのロール判定（saasOwner / orgOwner）
 * ・団体IDの決定
 * ・Client Component（ResultsClient）へ必要情報を渡す
 *
 * 【ロール仕様】
 * ・systemRole = "owner" → SaaSオーナー
 * ・systemRole = "user"  → 団体オーナー
 * ============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResultsClient from "./ResultsClient";
import { prisma } from "@/lib/prisma";

export default async function ResultsPage() {
  // ------------------------------------------------------------
  // 認証チェック
  // ------------------------------------------------------------
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // ------------------------------------------------------------
  // ロール判定（2ロール構成）
  // ------------------------------------------------------------
  let role: "saasOwner" | "orgOwner" = "orgOwner";

  if (session.user.systemRole === "owner") {
    role = "saasOwner";
  }

  // ------------------------------------------------------------
  // 団体IDの決定
  // ------------------------------------------------------------
  let organizationId: string | null = null;

  if (role === "saasOwner") {
    // SaaSオーナーは複数団体を扱うため、Client 側で選択させる
    organizationId = null;
  } else {
    // 団体オーナーは自分の団体を1つだけ持つ
    const org = await prisma.organization.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!org) {
      return <div>所属団体がありません。</div>;
    }

    organizationId = org.id;
  }

  // ------------------------------------------------------------
  // Client Component の描画
  // ------------------------------------------------------------
  return (
    <ResultsClient
      role={role}
      organizationId={organizationId}
    />
  );
}
