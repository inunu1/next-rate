/**
 * ============================================================================
 * Player API（SaaS マルチテナント対応 / SIer 風・完全版）
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
 * 団体権限チェック（型安全版）
 * ========================================================================== */
function requireOrgPermission(session: Session, organizationId: string) {
  const membership = session.user.organizations.find(
    (o) => o.id === organizationId
  );

  if (!membership) {
    return { error: "この団体へのアクセス権がありません", status: 403 };
  }

  return membership.role; // "owner" | "editor" | "viewer"
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

  const role = requireOrgPermission(session, organizationId);
  if (typeof role !== "string") return jsonError(role.error, role.status);

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
 * POST: プレイヤー登録（owner / editor）
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

  const role = requireOrgPermission(session, organizationId);
  if (typeof role !== "string") return jsonError(role.error, role.status);
  if (role === "viewer") return jsonError("閲覧権限では登録できません", 403);

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
 * DELETE: プレイヤー削除（owner / editor）
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

  const role = requireOrgPermission(session, organizationId);
  if (typeof role !== "string") return jsonError(role.error, role.status);
  if (role === "viewer") return jsonError("閲覧権限では削除できません", 403);

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
