/**
 * ============================================================================
 * 【機能概要】
 * 対局結果（Result）を扱う REST API。
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import type { Result } from "@prisma/client";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
 * 型定義
 * ============================================================================ */
type AuthSuccess = { session: Session };
type AuthError = { error: string; status: number };
type AuthResult = AuthSuccess | AuthError;

import type { PostResultBody } from "@/types/api";

/* ============================================================================
 * 認証チェック
 * ============================================================================ */
async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }
  return { session };
}

/* ============================================================================
 * targetUserId の決定ロジック
 * ============================================================================ */
function resolveTargetUserId(
  session: Session,
  userIdParam: string | null
): string | AuthError {
  const role = session.user.systemRole;

  if (role === "admin") {
    // admin は組織一覧から操作する想定だが既存実装互換のためユーザー id を返す
    return session.user.id;
  }

  if (!userIdParam) {
    return { error: "userId が指定されていません（owner のみ必須）", status: 400 };
  }

  return userIdParam;
}

/* ============================================================================
 * GET: 対局結果検索
 * ============================================================================ */
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
    let targetMatchDate: number | null = null;

    if (dateStr) {
      targetMatchDate = Number(dateStr.replaceAll("-", ""));
    } else {
      const latest = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(`
      SELECT DISTINCT "matchDate"
      FROM "Result"
      WHERE "organizationId" = '${target}'
      ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
      ORDER BY "matchDate" DESC LIMIT 1
    `);

      if (latest.length === 0) {
        return jsonOk({ date: null, prevDate: null, nextDate: null, results: [] });
      }

      targetMatchDate = latest[0].matchDate;
    }

    const results = await prisma.$queryRawUnsafe<Result[]>(`
      SELECT *
      FROM "Result"
      WHERE "matchDate" = ${targetMatchDate}
        AND "organizationId" = '${target}'
        ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
      ORDER BY "roundIndex" ASC
    `);

    const prev = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(`
      SELECT DISTINCT "matchDate"
      FROM "Result"
      WHERE "matchDate" < ${targetMatchDate}
        AND "organizationId" = '${target}'
        ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
      ORDER BY "matchDate" DESC LIMIT 1
    `);

    const next = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(`
      SELECT DISTINCT "matchDate"
      FROM "Result"
      WHERE "matchDate" > ${targetMatchDate}
        AND "organizationId" = '${target}'
        ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
      ORDER BY "matchDate" ASC LIMIT 1
    `);

    const fmt = (n: number | undefined) => {
      if (!n) return null;
      const s = n.toString();
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    };

    return jsonOk({
      date: fmt(targetMatchDate)!,
      prevDate: fmt(prev[0]?.matchDate),
      nextDate: fmt(next[0]?.matchDate),
      results,
    });
  } catch (err) {
    console.error("GET /api/private/result error:", err);
    return jsonError("対局結果の取得に失敗しました", 500);
  }
}

/* ============================================================================
 * POST: 対局結果登録
 * ============================================================================ */
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

  const {
    winnerId,
    winnerName,
    winnerRate,
    loserId,
    loserName,
    loserRate,
    matchDate,
    roundIndex,
    userId,
  } = body;

  const target = resolveTargetUserId(session, userId ?? null);
  if (typeof target !== "string") {
    return jsonError(target.error, target.status);
  }

  try {
    if (!winnerId || !loserId || !matchDate || !roundIndex) {
      return jsonError("必須項目が不足しています", 400);
    }

    const winner = await prisma.player.findUnique({ where: { id: winnerId } });
    const loser = await prisma.player.findUnique({ where: { id: loserId } });

    if (!winner || !loser) {
      return jsonError("プレイヤーが存在しません", 404);
    }

    if (winner.organizationId !== target || loser.organizationId !== target) {
      return jsonError("他団体のプレイヤーは登録できません", 403);
    }

    const conflict = await prisma.result.findFirst({
      where: {
        matchDate,
        roundIndex,
        organizationId: target,
        OR: [{ winnerId }, { loserId }],
      },
    });

    if (conflict) {
      return jsonError("同一ラウンドで既に対局済みのプレイヤーが含まれています", 409);
    }

    const result = await prisma.result.create({
      data: {
        winnerId,
        winnerName,
        winnerRate,
        loserId,
        loserName,
        loserRate,
        matchDate,
        roundIndex,
        organizationId: target,
      },
    });

    return jsonOk(result);
  } catch (err) {
    console.error("POST /api/private/result error:", err);
    return jsonError("対局結果登録に失敗しました", 500);
  }
}

/* ============================================================================
 * DELETE: 対局結果削除
 * ============================================================================ */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }
  const session = auth.session;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userIdParam = searchParams.get("userId");

    if (!id) {
      return jsonError("id が必要です", 400);
    }

    const target = resolveTargetUserId(session, userIdParam);
    if (typeof target !== "string") {
      return jsonError(target.error, target.status);
    }


    const result = await prisma.result.findUnique({ where: { id } });

    if (!result) {
      return jsonError("対局結果が存在しません", 404);
    }

    if (result.organizationId !== target) {
      return jsonError("他団体の対局結果は削除できません", 403);
    }

    await prisma.result.delete({ where: { id } });

    return jsonOk({ success: true });
  } catch (err) {
    console.error("DELETE /api/private/result error:", err);
    return jsonError("対局結果削除に失敗しました", 500);
  }
}
