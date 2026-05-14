/**
 * ============================================================================
 * 【機能概要】
 * プレイヤー（Player）情報を扱う REST API（完全リファクタ版）
 *
 * 【設計方針】
 * 1. 認証必須（next-auth）
 * 2. owner / admin で操作可能な userId を制御
 * 3. レスポンス形式を { ok, data?, error? } に統一
 * 4. バリデーションとエラーハンドリングを明確化
 * 5. Prisma アクセスは責務ごとに整理
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthSuccess = { session: Session };
type AuthError = { error: string; status: number };
type AuthResult = AuthSuccess | AuthError;

type PostPlayerBody = {
  name: string;
  initialRate: number;
  userId?: string;
};

type DeletePlayerBody = {
  id: string;
  userId?: string;
};

/* ============================================================================
 * 共通レスポンスヘルパ
 * ========================================================================== */
/* ============================================================================
 * 認証チェック
 * ========================================================================== */
async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  return { session };
}

/* ============================================================================
 * targetUserId の決定ロジック
 *  - admin: 自分自身の userId 固定
 *  - owner: userIdParam が必須
 * ========================================================================== */
function resolveTargetUserId(
  session: Session,
  userIdParam: string | null
): string | AuthError {
  const role = session.user.role;

  if (role === "admin") {
    return session.user.id;
  }

  if (!userIdParam) {
    return {
      error: "userId が指定されていません（owner のみ必須）",
      status: 400,
    };
  }

  return userIdParam;
}

/* ============================================================================
 * バリデーション
 * ========================================================================== */
function validatePlayerInput(name: string, initialRate: number) {
  if (!name || !name.trim()) {
    return "プレイヤー名は必須です";
  }
  if (!Number.isFinite(initialRate)) {
    return "initialRate は数値である必要があります";
  }
  if (initialRate < 0) {
    return "initialRate は 0 以上である必要があります";
  }
  if (name.length > 100) {
    return "プレイヤー名が長すぎます（100文字以内）";
  }
  return null;
}

/* ============================================================================
 * GET: プレイヤー一覧取得
 * ========================================================================== */
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
    const players = await prisma.player.findMany({
      where: {
        deletedAt: null,
        userId: target,
      },
      orderBy: { name: "asc" },
    });

    return jsonOk(players);
  } catch (err) {
    console.error("GET /api/private/player error:", err);
    return jsonError("プレイヤー取得に失敗しました", 500);
  }
}

/* ============================================================================
 * POST: プレイヤー新規登録
 * ========================================================================== */
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

  const { name, initialRate, userId } = body;

  const target = resolveTargetUserId(session, userId ?? null);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  const validationError = validatePlayerInput(name, initialRate);
  if (validationError) {
    return jsonError(validationError, 400);
  }

  try {
    // 同一団体内で同名プレイヤーが存在しないかチェック
    const exists = await prisma.player.findFirst({
      where: {
        name,
        userId: target,
        deletedAt: null,
      },
    });

    if (exists) {
      return jsonError("同名のプレイヤーが既に存在します", 409);
    }

    const created = await prisma.player.create({
      data: {
        name: name.trim(),
        initialRate,
        currentRate: initialRate,
        userId: target,
      },
    });

    return jsonOk(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/private/player error:", err);
    return jsonError("プレイヤー登録に失敗しました", 500);
  }
}

/* ============================================================================
 * DELETE: プレイヤー論理削除
 * ========================================================================== */
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

  const { id, userId } = body;

  if (!id) {
    return jsonError("id は必須です", 400);
  }

  const target = resolveTargetUserId(session, userId ?? null);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    const player = await prisma.player.findUnique({ where: { id } });

    if (!player || player.deletedAt) {
      return jsonError("対象プレイヤーが存在しません", 404);
    }

    if (player.userId !== target) {
      return jsonError("このプレイヤーを削除する権限がありません", 403);
    }

    const deleted = await prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return jsonOk(deleted);
  } catch (err) {
    console.error("DELETE /api/private/player error:", err);
    return jsonError("プレイヤー削除に失敗しました", 500);
  }
}
