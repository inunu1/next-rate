/**
 * ============================================================================
 * 【画面概要】
 * プレイヤー管理画面（/players）の Server Component。
 *
 * 【責務】
 * ・認証チェック
 * ・ロール判定（owner / admin）
 * ・owner の場合は団体一覧を取得し、Client Component に渡す
 * ============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlayersClient from "./PlayersClient";
import { prisma } from "@/lib/prisma";

export default async function PlayersPage() {
  // --------------------------------------------------------------------------
  // 認証チェック
  // --------------------------------------------------------------------------
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role as "owner" | "admin";
  const currentOrganizationId = session.user.organizationId ?? session.user.id;

  // --------------------------------------------------------------------------
  // owner の場合のみ団体一覧を取得
  // name が null の場合は空文字に変換して UI で扱いやすくする
  // --------------------------------------------------------------------------
  let allUsers: { id: string; name: string }[] | undefined = undefined;

  if (role === "owner") {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, organizationId: true },
      orderBy: { name: "asc" },
    });

    allUsers = users
      .filter((u) => u.organizationId)
      .map((u) => ({
        id: u.organizationId!,
        name: u.name ?? "", // ★ null を空文字に変換
      }));
  }

  // --------------------------------------------------------------------------
  // Client Component の描画
  // --------------------------------------------------------------------------
  return (
    <PlayersClient
      currentOrganizationId={currentOrganizationId}
      role={role}
      allUsers={allUsers}
    />
  );
}
