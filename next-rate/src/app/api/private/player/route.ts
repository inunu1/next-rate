/**
 * ============================================================================
 * 【機能概要】
 * プレイヤー（Player）情報を扱う REST API（サービス層版）
 * ============================================================================
 */

import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAuth, resolveTargetUserId } from "@/lib/authService";

import { getPlayers, createPlayer, deletePlayer } from "@/lib/playerService";
import type { PostPlayerBody, DeletePlayerBody } from "@/types/player";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
 * GET: プレイヤー一覧取得
 * ============================================================================
 */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }
  const session = auth.session;

  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");

  const target = resolveTargetUserId(session, userIdParam);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    const players = await getPlayers(target);
    return jsonOk(players);
  } catch (err) {
    console.error("GET /api/private/player error:", err);
    return jsonError("プレイヤー取得に失敗しました", 500);
  }
}

/* ============================================================================
 * POST: プレイヤー新規登録
 * ============================================================================
 */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }
  const session = auth.session;

  let body: PostPlayerBody;
  try {
    body = (await req.json()) as PostPlayerBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  const target = resolveTargetUserId(session, body.userId ?? null);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    const result = await createPlayer(body, target);

    if ("error" in result) {
      return jsonError(
        result.error ?? "エラーが発生しました",
        result.status ?? 400
      );
    }

    return jsonOk(result.data, { status: 201 });
  } catch (err) {
    console.error("POST /api/private/player error:", err);
    return jsonError("プレイヤー登録に失敗しました", 500);
  }
}

/* ============================================================================
 * DELETE: プレイヤー論理削除
 * ============================================================================
 */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }
  const session = auth.session;

  let body: DeletePlayerBody;
  try {
    body = (await req.json()) as DeletePlayerBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  const target = resolveTargetUserId(session, body.userId ?? null);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    const result = await deletePlayer(body, target);

    if ("error" in result) {
      return jsonError(
        result.error ?? "エラーが発生しました",
        result.status ?? 400
      );
    }

    return jsonOk(result.data);
  } catch (err) {
    console.error("DELETE /api/private/player error:", err);
    return jsonError("プレイヤー削除に失敗しました", 500);
  }
}
