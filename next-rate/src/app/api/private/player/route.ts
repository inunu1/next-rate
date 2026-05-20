/**
 * ============================================================================
 * Player API（2ロール構成 / 中間テーブルなし）
 *
 * 【ロール仕様】
 * ・SaaSオーナー（systemRole="owner"）
 *      → 全団体の操作が可能
 *
 * ・団体オーナー（systemRole="user"）
 *      → 自分が所有する団体のみ操作可能
 *
 * 【権限判定】
 * ・SaaSオーナー：無条件で許可
 * ・団体オーナー：organization.ownerId === session.user.id の場合のみ許可
 *
 * 【非責務】
 * ・DB のリレーションは使用しない（すべて String FK）
 * ・複数ユーザーの団体所属管理は行わない
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
 * リクエストボディ型
 * ========================================================================== */
type PostBody = {
  name: string;
  initialRate: number;
  organizationId: string;
};

type DeleteBody = {
  id: string;
  organizationId: string;
};

/* ============================================================================
 * 認証チェック
 * ========================================================================== */
async function requireAuth(): Promise<
  { session: Session } | { error: string; status: number }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }
  return { session };
}

/* ============================================================================
 * 団体権限チェック（2ロール構成）
 * - SaaSオーナー：全団体操作可能
 * - 団体オーナー：自分が所有する団体のみ操作可能
 * ========================================================================== */
async function requireOrgPermission(session: Session, organizationId: string) {
  // SaaSオーナーは全団体OK
  if (session.user.systemRole === "owner") {
    return "saasOwner";
  }

  // 団体オーナーか確認
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  if (!org) {
    return { error: "団体が存在しません", status: 404 };
  }

  if (org.ownerId !== session.user.id) {
    return { error: "この団体へのアクセス権がありません", status: 403 };
  }

  return "orgOwner";
}

/* ============================================================================
 * GET: プレイヤー一覧取得
 * ========================================================================== */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return jsonError(auth.error, auth.status);

  const session = auth.session;
  const { searchParams } = new URL(req.url);

  const org = searchParams.get("organizationId");
  if (!org) return jsonError("organizationId は必須です", 400);
  const organizationId: string = org;

  const perm = await requireOrgPermission(session, organizationId);
  if (typeof perm !== "string") return jsonError(perm.error, perm.status);

  try {
    const players = await prisma.player.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });

    return jsonOk(players);
  } catch (err) {
    console.error("GET /player error:", err);
    return jsonError("プレイヤー取得に失敗しました", 500);
  }
}

/* ============================================================================
 * POST: プレイヤー登録（団体オーナー / SaaSオーナー）
 * ========================================================================== */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return jsonError(auth.error, auth.status);

  const session = auth.session;

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  const { name, initialRate, organizationId } = body;

  const perm = await requireOrgPermission(session, organizationId);
  if (typeof perm !== "string") return jsonError(perm.error, perm.status);

  if (perm !== "saasOwner" && perm !== "orgOwner") {
    return jsonError("登録権限がありません", 403);
  }

  if (!name || !name.trim()) return jsonError("プレイヤー名は必須です", 400);
  if (!Number.isFinite(initialRate)) return jsonError("initialRate は数値である必要があります", 400);

  try {
    const exists = await prisma.player.findFirst({
      where: { name, organizationId, deletedAt: null },
    });

    if (exists) return jsonError("同名のプレイヤーが既に存在します", 409);

    const created = await prisma.player.create({
      data: {
        name: name.trim(),
        initialRate,
        currentRate: initialRate,
        organizationId,
      },
    });

    return jsonOk(created, { status: 201 });
  } catch (err) {
    console.error("POST /player error:", err);
    return jsonError("プレイヤー登録に失敗しました", 500);
  }
}

/* ============================================================================
 * DELETE: プレイヤー削除（団体オーナー / SaaSオーナー）
 * ========================================================================== */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return jsonError(auth.error, auth.status);

  const session = auth.session;

  let body: DeleteBody;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  const { id, organizationId } = body;

  const perm = await requireOrgPermission(session, organizationId);
  if (typeof perm !== "string") return jsonError(perm.error, perm.status);

  if (perm !== "saasOwner" && perm !== "orgOwner") {
    return jsonError("削除権限がありません", 403);
  }

  try {
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player || player.deletedAt) return jsonError("対象プレイヤーが存在しません", 404);

    if (player.organizationId !== organizationId) {
      return jsonError("このプレイヤーを削除する権限がありません", 403);
    }

    const deleted = await prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return jsonOk(deleted);
  } catch (err) {
    console.error("DELETE /player error:", err);
    return jsonError("プレイヤー削除に失敗しました", 500);
  }
}
