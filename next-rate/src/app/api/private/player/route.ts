/**
 * ============================================================================
 * 【機能概要】
 * プレイヤー（Player）情報を扱う REST API。
 *
 * 【設計方針】
 * ・API は常に targetUserId を基準にデータを操作する。
 * ・targetUserId の決定ルール：
 *      ① admin（団体オーナー）
 *          - リクエストパラメータの userId は無視する
 *          - セッションの user.id を強制使用
 *
 *      ② owner（SaaS 運営者）
 *          - リクエストパラメータの userId を必須とする
 *          - 画面側で「どの団体か」を選択してから操作する
 *
 * 【提供機能】
 * ① GET    /api/private/player
 *      - プレイヤー一覧取得
 *
 * ② POST   /api/private/player
 *      - プレイヤー新規登録
 *
 * ③ DELETE /api/private/player
 *      - プレイヤー論理削除
 *
 * 【例外処理方針】
 * ・認証エラー：401
 * ・認可エラー：403
 * ・業務エラー：400 / 404
 * ・システムエラー：500
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
 * 認証結果型定義（成功/失敗の明確な型分岐）
 * ========================================================================== */
type AuthSuccess = { session: any };
type AuthError = { error: string; status: number };
type AuthResult = AuthSuccess | AuthError;

/* ============================================================================
 * 認証チェック（owner/admin 共通）
 * ========================================================================== */
async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  return { session };
}

/* ============================================================================
 * targetUserId の決定ロジック（本 API の中核）
 * ============================================================================
 * 【仕様】
 * ・admin：セッションの user.id を強制使用（他団体アクセス禁止）
 * ・owner：リクエストパラメータの userId を必須とする
 * ========================================================================== */
function resolveTargetUserId(
  session: any,
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
 * ============================================================================
 * 【処理概要】
 * ① targetUserId の決定
 * ② 該当団体のプレイヤー一覧を取得
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
 * ============================================================================
 * 【処理概要】
 * ① targetUserId の決定
 * ② 入力チェック
 * ③ プレイヤー登録
 * ========================================================================== */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const session = auth.session;

  const body = await req.json();
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
 * ============================================================================
 * 【処理概要】
 * ① targetUserId の決定
 * ② 対象プレイヤーの存在確認
 * ③ 権限チェック（他団体アクセス禁止）
 * ④ 論理削除
 * ========================================================================== */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const session = auth.session;

  const body = await req.json();
  const { id, userId } = body;

  if (!id) {
    return NextResponse.json(
      { error: "id は必須です" },
      { status: 400 }
    );
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
