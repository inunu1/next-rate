/**
 * ============================================================================
 * Result API（SaaS マルチテナント対応 / SIer 風・完全版）
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/apiResponse";
import type { PostResultBody } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 * 団体権限チェック（player API と同じ）
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
 * GET: 対局結果取得
 * ========================================================================== */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return jsonError(auth.error, auth.status);

  const session = auth.session;
  const { searchParams } = new URL(req.url);

  const org = searchParams.get("organizationId");
  if (!org) return jsonError("organizationId は必須です", 400);
  const organizationId: string = org;

  const dateStr = searchParams.get("date") ?? undefined;
  const playerId = searchParams.get("playerId") ?? undefined;

  const role = requireOrgPermission(session, organizationId);
  if (typeof role !== "string") return jsonError(role.error, role.status);

  try {
    // ① 対象日付の決定
    let targetMatchDate: number | null = null;

    if (dateStr) {
      targetMatchDate = Number(dateStr.replaceAll("-", ""));
    } else {
      const latest = await prisma.result.findFirst({
        where: {
          organizationId,
          ...(playerId
            ? { OR: [{ winnerId: playerId }, { loserId: playerId }] }
            : {}),
        },
        orderBy: { matchDate: "desc" },
        select: { matchDate: true },
      });

      if (!latest) {
        return jsonOk({
          date: null,
          prevDate: null,
          nextDate: null,
          results: [],
        });
      }

      targetMatchDate = latest.matchDate;
    }

    // ② 対象日の対局結果
    const results = await prisma.result.findMany({
      where: {
        organizationId,
        matchDate: targetMatchDate,
        ...(playerId
          ? { OR: [{ winnerId: playerId }, { loserId: playerId }] }
          : {}),
      },
      orderBy: { roundIndex: "asc" },
    });

    // ③ 前日
    const prev = await prisma.result.findFirst({
      where: {
        organizationId,
        matchDate: { lt: targetMatchDate },
        ...(playerId
          ? { OR: [{ winnerId: playerId }, { loserId: playerId }] }
          : {}),
      },
      orderBy: { matchDate: "desc" },
      select: { matchDate: true },
    });

    // ④ 翌日
    const next = await prisma.result.findFirst({
      where: {
        organizationId,
        matchDate: { gt: targetMatchDate },
        ...(playerId
          ? { OR: [{ winnerId: playerId }, { loserId: playerId }] }
          : {}),
      },
      orderBy: { matchDate: "asc" },
      select: { matchDate: true },
    });

    const fmt = (n: number | null | undefined) => {
      if (!n) return null;
      const s = n.toString();
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    };

    return jsonOk({
      date: fmt(targetMatchDate),
      prevDate: fmt(prev?.matchDate),
      nextDate: fmt(next?.matchDate),
      results,
    });
  } catch (err) {
    console.error("GET /result error:", err);
    return jsonError("対局結果取得に失敗しました", 500);
  }
}

/* ============================================================================
 * POST: 対局結果登録
 * ========================================================================== */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return jsonError(auth.error, auth.status);

  const session = auth.session;

  let body: PostResultBody;
  try {
    body = (await req.json()) as PostResultBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  const {
    winnerId,
    winnerName,
    winnerRate,
    loserId,
    loserName,
    loserRate,
    matchDate,
    roundIndex,
    organizationId,
  } = body;

  const role = requireOrgPermission(session, organizationId);
  if (typeof role !== "string") return jsonError(role.error, role.status);
  if (role === "viewer") return jsonError("閲覧権限では登録できません", 403);

  try {
    const winner = await prisma.player.findUnique({ where: { id: winnerId } });
    const loser = await prisma.player.findUnique({ where: { id: loserId } });

    if (!winner || !loser) return jsonError("プレイヤーが存在しません", 404);

    if (winner.organizationId !== organizationId || loser.organizationId !== organizationId) {
      return jsonError("他団体のプレイヤーは登録できません", 403);
    }

    const conflict = await prisma.result.findFirst({
      where: {
        matchDate,
        roundIndex,
        organizationId,
        OR: [{ winnerId }, { loserId }],
      },
    });

    if (conflict) {
      return jsonError("同一ラウンドで既に対局済みのプレイヤーが含まれています", 409);
    }

    const created = await prisma.result.create({
      data: {
        winnerId,
        winnerName,
        winnerRate,
        loserId,
        loserName,
        loserRate,
        matchDate,
        roundIndex,
        organizationId,
      },
    });

    return jsonOk(created, { status: 201 });
  } catch (err) {
    console.error("POST /result error:", err);
    return jsonError("対局結果登録に失敗しました", 500);
  }
}

/* ============================================================================
 * DELETE: 対局結果削除
 * ========================================================================== */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return jsonError(auth.error, auth.status);

  const session = auth.session;

  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  const org = searchParams.get("organizationId");

  if (!id) return jsonError("id は必須です", 400);
  if (!org) return jsonError("organizationId は必須です", 400);

  const organizationId: string = org;

  const role = requireOrgPermission(session, organizationId);
  if (typeof role !== "string") return jsonError(role.error, role.status);
  if (role === "viewer") return jsonError("閲覧権限では削除できません", 403);

  try {
    const result = await prisma.result.findUnique({ where: { id } });
    if (!result) return jsonError("対局結果が存在しません", 404);

    if (result.organizationId !== organizationId) {
      return jsonError("この対局結果を削除する権限がありません", 403);
    }

    const deleted = await prisma.result.delete({ where: { id } });

    return jsonOk(deleted);
  } catch (err) {
    console.error("DELETE /result error:", err);
    return jsonError("対局結果削除に失敗しました", 500);
  }
}
