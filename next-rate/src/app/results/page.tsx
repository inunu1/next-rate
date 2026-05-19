/**
 * ============================================================================
 * 【画面概要】
 * 対局結果管理画面（/results）の Server Component。
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・ユーザーのロール判定（owner / admin）
 * ・admin は所属団体（Membership）から organizationId を取得
 * ・owner は全団体一覧（Organization）を取得して Client に渡す
 * ・Client Component（ResultsClient）の描画
 *
 * 【非責務】
 * ・対局結果の取得（Client 側で API 呼び出し）
 * ・プレイヤー一覧の取得（Client 側で API 呼び出し）
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
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.systemRole as "owner" | "admin";

  /* --------------------------------------------------------------------------
   * admin の場合：所属団体（Membership）から organizationId を取得
   * owner の場合：団体一覧を取得して Client に渡す
   * ------------------------------------------------------------------------ */

  let currentOrganizationId: string | null = null;
  let allUsers: { id: string; name: string }[] | undefined = undefined;

  if (role === "admin") {
    // ★ admin は自分が所属する団体のみ操作可能
    const org = session.user.organizations?.[0];
    if (!org) {
      throw new Error("所属団体がありません（admin）");
    }
    currentOrganizationId = org.id;
  }

  if (role === "owner") {
    // ★ owner は全団体を操作可能
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    allUsers = orgs.map((o) => ({
      id: o.id,
      name: o.name,
    }));

    // owner の初期選択団体は最初の団体
    currentOrganizationId = allUsers[0]?.id ?? null;
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
