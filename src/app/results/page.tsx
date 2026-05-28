/**
 * ============================================================================
 * 【画面概要】
 * 対局結果管理画面（/results）の Server Component。
 *
 * 【責務】
 * ・認証チェック（未ログイン時は /login へリダイレクト）
 * ・ユーザーのロール判定（owner / admin）
 * ・owner の場合は団体一覧（allUsers）を取得して Client Component に渡す
 * ・Client Component（ResultsClient）の描画
 *
 * 【非責務】
 * ・対局結果の取得（Client 側で API 呼び出し）
 * ・プレイヤー一覧の取得（Client 側で API 呼び出し）
 *
 * 【設計方針】
 * ・Server Component は「認証」「ロール判定」「団体一覧取得」のみ担当し、
 *   業務データの取得はすべて API に集約する。
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

  const currentUserId = session.user.id;
  const role = session.user.role as "owner" | "admin";

  /* --------------------------------------------------------------------------
   * owner の場合のみ団体一覧を取得
   * name が null の場合は空文字に変換して UI で扱いやすくする
   * ------------------------------------------------------------------------ */
  let allUsers: { id: string; name: string }[] | undefined = undefined;

  if (role === "owner") {
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    allUsers = users.map((u) => ({
      id: u.id,
      name: u.name ?? "",
    }));
  }

  /* --------------------------------------------------------------------------
   * Client Component の描画
   * ------------------------------------------------------------------------ */
  return (
    <ResultsClient
      currentUserId={currentUserId}
      role={role}
      allUsers={allUsers}
    />
  );
}
