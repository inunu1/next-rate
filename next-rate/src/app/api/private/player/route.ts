/**
 * ============================================================================
 * 【機能概要】
 * プレイヤー（Player）情報を扱う REST API。
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
 * 型定義
 * ========================================================================== */
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
    return { error: "userId が指定されていません（owner のみ必須）", status: 400 };
  }

  return userIdParam;
}

/* ============================================================================
 * GET: プレイヤー一覧取得
 * ========================================================================== */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const session = auth.session;
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");

  const target = resolveTargetUserId(session, userIdParam);
  if (typeof target !== "string") {
    return NextResponse.json({ error: target.error }, { status: target.status });
  }

  try {
    const players = await prisma.player.findMany({
      where: {
        deletedAt: null,
        userId: target,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error("GET /api/private/player error:", err);
    return NextResponse.json(
      { error: "プレイヤー取得に失敗しました" },
      { status: 500 }
    );
  }
}

/* ============================================================================
 * POST: プレイヤー新規登録
 * ========================================================================== */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const session = auth.session;

  const body = (await req.json()) as PostPlayerBody;
  const { name, initialRate, userId } = body;

  const target = resolveTargetUserId(session, userId ?? null);
  if (typeof target !== "string") {
    return NextResponse.json({ error: target.error }, { status: target.status });
  }

  if (!name || initialRate == null) {
    return NextResponse.json(
      { error: "name と initialRate は必須です" },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.player.create({
      data: {
        name,
        initialRate,
        currentRate: initialRate,
        userId: target,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error("POST /api/private/player error:", err);
    return NextResponse.json(
      { error: "プレイヤー登録に失敗しました" },
      { status: 500 }
    );
  }
}

/* ============================================================================
 * DELETE: プレイヤー論理削除
 * ========================================================================== */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const session = auth.session;

  const body = (await req.json()) as DeletePlayerBody;
  const { id, userId } = body;

  if (!id) {
    return NextResponse.json({ error: "id は必須です" }, { status: 400 });
  }

  const target = resolveTargetUserId(session, userId ?? null);
  if (typeof target !== "string") {
    return NextResponse.json({ error: target.error }, { status: target.status });
  }

  try {
    const player = await prisma.player.findUnique({ where: { id } });

    if (!player || player.userId !== target) {
      return NextResponse.json(
        { error: "対象プレイヤーが存在しないか、権限がありません" },
        { status: 404 }
      );
    }

    const deleted = await prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(deleted);
  } catch (err) {
    console.error("DELETE /api/private/player error:", err);
    return NextResponse.json(
      { error: "プレイヤー削除に失敗しました" },
      { status: 500 }
    );
  }
}
