/**
 * ============================================================================
 * 【機能概要】
 * 対局結果（Result）を扱う REST API（サービス層版）
 * ============================================================================
 */

import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireAuth, resolveTargetUserId } from "@/lib/authService";

import {
  searchResults,
  createResult,
  deleteResult,
} from "@/lib/resultService";

import type { PostResultBody } from "@/types/result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
 * GET: 対局結果検索
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
  const dateStr = searchParams.get("date");
  const playerId = searchParams.get("playerId");

  const target = resolveTargetUserId(session, userIdParam);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    const response = await searchResults(target, dateStr, playerId);
    return jsonOk(response);
  } catch (err) {
    console.error("GET /api/private/result error:", err);
    return jsonError("対局結果の取得に失敗しました", 500);
  }
}

/* ============================================================================
 * POST: 対局結果登録
 * ============================================================================
 */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }
  const session = auth.session;

  let body: PostResultBody;
  try {
    body = (await req.json()) as PostResultBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  const target = resolveTargetUserId(session, body.userId ?? null);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    const result = await createResult(body, target);

    if ("error" in result) {
      return jsonError(
        result.error ?? "エラーが発生しました",
        result.status ?? 400
      );
    }

    return jsonOk(result.data);
  } catch (err) {
    console.error("POST /api/private/result error:", err);
    return jsonError("対局結果登録に失敗しました", 500);
  }
}

/* ============================================================================
 * DELETE: 対局結果削除
 * ============================================================================
 */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }
  const session = auth.session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const userIdParam = searchParams.get("userId");

  const target = resolveTargetUserId(session, userIdParam);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    const result = await deleteResult(id ?? "", target);

    if ("error" in result) {
      return jsonError(
        result.error ?? "エラーが発生しました",
        result.status ?? 400
      );
    }

    return jsonOk(result.data);
  } catch (err) {
    console.error("DELETE /api/private/result error:", err);
    return jsonError("対局結果削除に失敗しました", 500);
  }
}
