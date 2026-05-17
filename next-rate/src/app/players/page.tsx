/**
 * ============================================================================
 * プレイヤー管理画面（/players）Server Component（完全版）
 * ============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlayersClient from "./PlayersClient";

export default async function PlayersPage() {
  // ------------------------------------------------------------
  // 認証チェック
  // ------------------------------------------------------------
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // ------------------------------------------------------------
  // 所属団体（Membership）から organizationId を取得
  // ※ next-auth.d.ts で organizations は必須
  // ------------------------------------------------------------
  const membership = session.user.organizations[0];
  if (!membership) {
    return <div>所属団体がありません。</div>;
  }

  const organizationId = membership.id;
  const role = membership.role; // "owner" | "editor" | "viewer"

  // ------------------------------------------------------------
  // Client Component に団体IDを渡す
  // ------------------------------------------------------------
  return (
    <PlayersClient
      organizationId={organizationId}
      role={role}
    />
  );
}
