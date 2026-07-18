/**
 * ============================================================
 * 【機能概要】
 * 団体ユーザー（User）を扱う REST API。
 * owner（サービス運営者）のみ利用可能。
 * ============================================================
 */

import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireOwnerOrAdmin } from "@/lib/authService";

import { getAllUsers, createUser, deleteUser } from "@/lib/userService";
import type { PostUserBody, DeleteUserBody } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
 * GET: 団体ユーザー一覧（owner/admin）
 * ============================================================ */
export async function GET() {
  const auth = await requireOwnerOrAdmin();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  const session = auth.session;
  const requesterRole = session.user.role as "owner" | "admin";
  const requesterOrganizationId = session.user.organizationId ?? null;

  try {
    const users = await getAllUsers(requesterRole, requesterOrganizationId);
    return jsonOk(users);
  } catch (err) {
    console.error("GET /api/private/user error:", err);
    return jsonError("団体ユーザー取得に失敗しました", 500);
  }
}

/* ============================================================
 * POST: 団体ユーザー新規登録（owner / admin）
 * ============================================================ */
export async function POST(req: Request) {
  const auth = await requireOwnerOrAdmin();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  const session = auth.session;

  let body: PostUserBody;
  try {
    body = (await req.json()) as PostUserBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  try {
    const result = await createUser(
      body,
      session.user.role as "owner" | "admin",
      session.user.organizationId ?? null
    );

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
 * DELETE: 団体ユーザー削除（owner / admin）
 * ============================================================ */
export async function DELETE(req: Request) {
  const auth = await requireOwnerOrAdmin();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  const session = auth.session;

  let body: DeleteUserBody;
  try {
    body = (await req.json()) as DeleteUserBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  try {
    const result = await deleteUser(
      body,
      session.user.role as "owner" | "admin",
      session.user.organizationId ?? null
    );

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
