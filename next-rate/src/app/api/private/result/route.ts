/**
 * ============================================================================
 * 【機能概要】
 * 対局結果（Result）を扱う REST API。
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
 * ① GET    /api/private/result
 *      - 対局結果の検索（date / playerId）
 *      - 前後日付の取得
 *
 * ② POST   /api/private/result
 *      - 対局結果の新規登録
 *
 * ③ DELETE /api/private/result
 *      - 対局結果の削除
 *
 * 【例外処理方針】
 * ・認証エラー：401
 * ・認可エラー：403
 * ・業務エラー：400 / 404 / 409
 * ・システムエラー：500
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Result } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================================
 * 認証結果型定義
 * ========================================================================== */
type AuthSuccess = { session: any };
type AuthError = { error: string; status: number };
type AuthResult = AuthSuccess | AuthError;

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
 * targetUserId の決定ロジック（本 API の中核）
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
 * GET: 対局結果検索処理
 * ============================================================================
 * 【処理概要】
 * ① targetUserId の決定
 * ② 検索対象日付の決定
 * ③ 対象日の対局一覧取得
 * ④ 前後日付の取得
 * ⑤ 整形して返却
 * ========================================================================== */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const session = auth.session;

  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");
  const dateStr = searchParams.get("date");
  const playerId = searchParams.get("playerId");

  const target = resolveTargetUserId(session, userIdParam);
  if (typeof target !== "string") {
    return NextResponse.json({ error: target.error }, { status: target.status });
  }

  /* ① 検索対象日付の決定 */
  let targetMatchDate: number | null = null;

  if (dateStr) {
    targetMatchDate = Number(dateStr.replaceAll("-", ""));
  } else {
    let sql = `
      SELECT DISTINCT "matchDate"
      FROM "Result"
      WHERE "userId" = '${target}'
    `;

    if (playerId) {
      sql += ` AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}') `;
    }

    sql += ` ORDER BY "matchDate" DESC LIMIT 1`;

    const latest = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(sql);

    if (latest.length === 0) {
      return NextResponse.json({
        date: null,
        prevDate: null,
        nextDate: null,
        results: [],
      });
    }

    targetMatchDate = latest[0].matchDate;
  }

  /* ② 対象日の対局一覧取得 */
  let sqlResults = `
    SELECT *
    FROM "Result"
    WHERE "matchDate" = ${targetMatchDate}
      AND "userId" = '${target}'
  `;

  if (playerId) {
    sqlResults += ` AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}') `;
  }

  sqlResults += ` ORDER BY "roundIndex" ASC`;

  const results = await prisma.$queryRawUnsafe<Result[]>(sqlResults);

  /* ③ 前後日付の取得 */
  let sqlPrev = `
    SELECT DISTINCT "matchDate"
    FROM "Result"
    WHERE "matchDate" < ${targetMatchDate}
      AND "userId" = '${target}'
  `;

  if (playerId) {
    sqlPrev += ` AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}') `;
  }

  sqlPrev += ` ORDER BY "matchDate" DESC LIMIT 1`;

  const prev = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(sqlPrev);

  let sqlNext = `
    SELECT DISTINCT "matchDate"
    FROM "Result"
    WHERE "matchDate" > ${targetMatchDate}
      AND "userId" = '${target}'
  `;

  if (playerId) {
    sqlNext += ` AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}') `;
  }

  sqlNext += ` ORDER BY "matchDate" ASC LIMIT 1`;

  const next = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(sqlNext);

  /* ④ 整形して返却 */
  const fmt = (n: number | undefined) => {
    if (!n) return null;
    const s = n.toString();
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  return NextResponse.json({
    date: fmt(targetMatchDate)!,
    prevDate: fmt(prev[0]?.matchDate),
    nextDate: fmt(next[0]?.matchDate),
    results,
  });
}

/* ============================================================================
 * POST: 対局結果登録処理
 * ============================================================================
 * 【処理概要】
 * ① targetUserId の決定
 * ② 入力チェック
 * ③ 自団体プレイヤーの存在確認
 * ④ 同一ラウンド重複チェック
 * ⑤ 登録処理
 * ========================================================================== */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const session = auth.session;

  const body = await req.json();
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
    return NextResponse.json({ error: target.error }, { status: target.status });
  }

  /* ① 入力チェック */
  if (!winnerId || !loserId || !matchDate || !roundIndex) {
    return NextResponse.json(
      { error: "必須項目が不足しています" },
      { status: 400 }
    );
  }

  /* ② 自団体プレイヤーの存在確認 */
  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser = await prisma.player.findUnique({ where: { id: loserId } });

  if (!winner || !loser) {
    return NextResponse.json(
      { error: "プレイヤーが存在しません" },
      { status: 404 }
    );
  }

  if (winner.userId !== target || loser.userId !== target) {
    return NextResponse.json(
      { error: "他団体のプレイヤーは登録できません" },
      { status: 403 }
    );
  }

  /* ③ 同一ラウンド重複チェック */
  const conflict = await prisma.result.findFirst({
    where: {
      matchDate,
      roundIndex,
      userId: target,
      OR: [{ winnerId }, { loserId }],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "同一ラウンドで既に対局済みのプレイヤーが含まれています" },
      { status: 409 }
    );
  }

  /* ④ 登録処理 */
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
      userId: target,
    },
  });

  return NextResponse.json(result);
}

/* ============================================================================
 * DELETE: 対局結果削除処理
 * ============================================================================
 * 【処理概要】
 * ① targetUserId の決定
 * ② 対象データの存在確認
 * ③ 権限チェック
 * ④ 削除処理
 * ========================================================================== */
export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const session = auth.session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const userIdParam = searchParams.get("userId");

  if (!id) {
    return NextResponse.json(
      { error: "id が必要です" },
      { status: 400 }
    );
  }

  const target = resolveTargetUserId(session, userIdParam);
  if (typeof target !== "string") {
    return NextResponse.json({ error: target.error }, { status: target.status });
  }

  /* ① 対象データの存在確認 */
  const result = await prisma.result.findUnique({ where: { id } });

  if (!result) {
    return NextResponse.json(
      { error: "対局結果が存在しません" },
      { status: 404 }
    );
  }

  /* ② 権限チェック */
  if (result.userId !== target) {
    return NextResponse.json(
      { error: "他団体の対局結果は削除できません" },
      { status: 403 }
    );
  }

  /* ③ 削除処理 */
  await prisma.result.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
