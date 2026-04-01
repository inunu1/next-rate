import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Result } from "@prisma/client";

/* ============================================================================
 * GET: 対局結果の取得（検索条件：date / playerId）
 * ----------------------------------------------------------------------------
 * 【責務】
 * ・検索条件に一致する対局一覧を返却
 * ・検索条件に対する「前後日付」も返却
 * ========================================================================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const dateStr = searchParams.get("date");      // YYYY-MM-DD
  const playerId = searchParams.get("playerId"); // optional

  /* -------------------------------------------------------------------------
   * ① 検索対象日付の決定
   * ----------------------------------------------------------------------- */
  let targetMatchDate: number | null = null;

  if (dateStr) {
    targetMatchDate = Number(dateStr.replaceAll("-", ""));
  } else {
    let sql = `
      SELECT DISTINCT "matchDate"
      FROM "Result"
    `;

    if (playerId) {
      sql += ` WHERE "winnerId" = '${playerId}' OR "loserId" = '${playerId}' `;
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

  /* -------------------------------------------------------------------------
   * ② 対象日の対局一覧取得
   * ----------------------------------------------------------------------- */
  let sqlResults = `
    SELECT *
    FROM "Result"
    WHERE "matchDate" = ${targetMatchDate}
  `;

  if (playerId) {
    sqlResults += ` AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}') `;
  }

  sqlResults += ` ORDER BY "roundIndex" ASC`;

  const results = await prisma.$queryRawUnsafe<Result[]>(sqlResults);

  /* -------------------------------------------------------------------------
   * ③ 前後日付の取得
   * ----------------------------------------------------------------------- */
  let sqlPrev = `
    SELECT DISTINCT "matchDate"
    FROM "Result"
    WHERE "matchDate" < ${targetMatchDate}
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
  `;

  if (playerId) {
    sqlNext += ` AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}') `;
  }

  sqlNext += ` ORDER BY "matchDate" ASC LIMIT 1`;

  const next = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(sqlNext);

  /* -------------------------------------------------------------------------
   * ④ 整形して返却
   * ----------------------------------------------------------------------- */
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
 * POST: 対局結果の登録
 * ========================================================================= */
export async function POST(req: Request) {
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
  } = body;

  if (!winnerId || !loserId || !matchDate || !roundIndex) {
    return NextResponse.json(
      { error: "必須項目が不足しています" },
      { status: 400 }
    );
  }

  const conflict = await prisma.result.findFirst({
    where: {
      matchDate,
      roundIndex,
      OR: [{ winnerId }, { loserId }],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "同一ラウンドで既に対局済みのプレイヤーが含まれています" },
      { status: 409 }
    );
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
    },
  });

  return NextResponse.json(result);
}

/* ============================================================================
 * DELETE: 対局結果の削除
 * ========================================================================= */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id が必要です" },
      { status: 400 }
    );
  }

  await prisma.result.delete({ where: { id } });

  return NextResponse.json({ success: true });
}