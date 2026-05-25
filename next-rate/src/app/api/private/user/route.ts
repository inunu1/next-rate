/**
 * ============================================================
 * 【機能概要】
 * 団体ユーザー（User）を扱う REST API。
 * owner（サービス運営者）のみ利用可能。
 * ============================================================
 */

import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireOwner } from "@/lib/authService";

import { getAllUsers, createUser, deleteUser } from "@/lib/userService";
import type { PostUserBody, DeleteUserBody } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
 * GET: 全団体ユーザー一覧（owner 専用）
 * ============================================================ */
export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  try {
    const users = await getAllUsers();
    return jsonOk(users);
  } catch (err) {
    console.error("GET /api/private/user error:", err);
    return jsonError("団体ユーザー取得に失敗しました", 500);
  }
}

/* ============================================================
 * POST: 団体ユーザー新規登録（owner 専用）
 * ============================================================ */
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  let body: PostUserBody;
  try {
    body = (await req.json()) as PostUserBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  try {
    const result = await createUser(body);

    if ("error" in result) {
      return jsonError(
        result.error ?? "エラーが発生しました",
        result.status ?? 400
      );
    }

    return jsonOk(result.data);
  } catch (err) {
    console.error("POST /api/private/user error:", err);
    return jsonError("団体ユーザー登録に失敗しました", 500);
  }
}

/* ============================================================
 * DELETE: 団体ユーザー削除（owner 専用）
 * ============================================================ */
export async function DELETE(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  let body: DeleteUserBody;
  try {
    body = (await req.json()) as DeleteUserBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  try {
    const result = await deleteUser(body);

    if ("error" in result) {
      return jsonError(
        result.error ?? "エラーが発生しました",
        result.status ?? 400
      );
    }

    return jsonOk(result.data);
  } catch (err) {
    console.error("DELETE /api/private/user error:", err);
    return jsonError("団体ユーザー削除に失敗しました", 500);
  }
}
