/**
 * ============================================================================
 * 対局結果管理画面（/results）Server Component（完全版）
 * ============================================================================
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・団体内ロール判定（owner / editor / viewer）
 * ・owner：全団体一覧を取得して Client に渡す
 * ・editor/viewer：自団体のみ操作
 * ・Client Component（ResultsClient）へ props を渡す
 * ============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResultsClient from "./ResultsClient";
import { prisma } from "@/lib/prisma";

export default async function ResultsPage() {
  /* --------------------------------------------------------------------------
   * 認証チェック
   * ------------------------------------------------------------------------ */
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  /* --------------------------------------------------------------------------
   * 団体内ロールを Membership から取得
   * ------------------------------------------------------------------------ */
  const membership = session.user.organizations[0];
  if (!membership) {
    return <div>所属団体がありません。</div>;
  }

  const role = membership.role; // "owner" | "editor" | "viewer"

  /* --------------------------------------------------------------------------
   * owner：全団体を操作可能
   * editor/viewer：自団体のみ
   * ------------------------------------------------------------------------ */

  let currentOrganizationId: string | null = null;
  let allUsers: { id: string; name: string }[] | undefined = undefined;

  if (role === "owner") {
    // owner は全団体を操作可能
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    allUsers = orgs.map((o) => ({
      id: o.id,
      name: o.name,
    }));

    // 初期選択団体は最初の団体
    currentOrganizationId = allUsers[0]?.id ?? null;
  } else {
    // editor / viewer は自団体のみ
    currentOrganizationId = membership.id;
  }

  if (!currentOrganizationId) {
    throw new Error("organizationId を決定できませんでした");
  }

  /* --------------------------------------------------------------------------
   * Client Component の描画
   * ------------------------------------------------------------------------ */
  return (
    <ResultsClient
      currentOrganizationId={currentOrganizationId}
      role={role}
      allUsers={allUsers}
    />
  );
}
