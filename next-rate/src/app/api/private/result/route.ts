import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/* ============================================================================
 * Utility: matchDate(Int) → YYYY-MM-DD
 * ========================================================================== */
function formatMatchDate(md: number): string {
  const s = md.toString();
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/* ============================================================================
 * Utility: YYYY-MM-DD → matchDate(Int)
 * ========================================================================== */
function toMatchDate(dateStr: string): number {
  return Number(dateStr.replaceAll('-', ''));
}

/* ============================================================================
 * GET: 対局結果の取得（matchDate + roundIndex）
 * ========================================================================== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const date = searchParams.get('date');      // YYYY-MM-DD
  const playerId = searchParams.get('playerId');

  /* -------------------------------------------------------------------------
   * ① 最新 matchDate の決定
   * ----------------------------------------------------------------------- */
  let latest:
    | { matchDate: number }
    | null = null;

  if (!date && playerId) {
    latest = await prisma.result.findFirst({
      where: {
        OR: [
          { winnerId: playerId },
          { loserId: playerId },
        ],
      },
      orderBy: { matchDate: 'desc' },
      select: { matchDate: true },
    });
  } else {
    latest = await prisma.result.findFirst({
      orderBy: { matchDate: 'desc' },
      select: { matchDate: true },
    });
  }

  if (!latest) {
    return NextResponse.json({
      mode: playerId ? 'player' : 'date',
      date: null,
      results: [],
      prevDate: null,
      nextDate: null,
    });
  }

  const latestDate = formatMatchDate(latest.matchDate);

  /* -------------------------------------------------------------------------
   * ② targetDate の決定
   * ----------------------------------------------------------------------- */
  const targetDate = date ?? latestDate;
  const targetMatchDate = toMatchDate(targetDate);

  /* -------------------------------------------------------------------------
   * ③ 対局データ取得
   * ----------------------------------------------------------------------- */
  const results = await prisma.result.findMany({
    where: {
      matchDate: targetMatchDate,
      ...(playerId
        ? {
            OR: [
              { winnerId: playerId },
              { loserId: playerId },
            ],
          }
        : {}),
    },
    orderBy: { roundIndex: 'asc' },
  });

  /* -------------------------------------------------------------------------
   * ④ prevDate
   * ----------------------------------------------------------------------- */
  const prev = await prisma.result.findFirst({
    where: {
      matchDate: { lt: targetMatchDate },
      ...(playerId
        ? {
            OR: [
              { winnerId: playerId },
              { loserId: playerId },
            ],
          }
        : {}),
    },
    orderBy: { matchDate: 'desc' },
    select: { matchDate: true },
  });

  const prevDate = prev ? formatMatchDate(prev.matchDate) : null;

  /* -------------------------------------------------------------------------
   * ⑤ nextDate
   * ----------------------------------------------------------------------- */
  const next = await prisma.result.findFirst({
    where: {
      matchDate: { gt: targetMatchDate },
      ...(playerId
        ? {
            OR: [
              { winnerId: playerId },
              { loserId: playerId },
            ],
          }
        : {}),
    },
    orderBy: { matchDate: 'asc' },
    select: { matchDate: true },
  });

  const nextDate = next ? formatMatchDate(next.matchDate) : null;

  /* -------------------------------------------------------------------------
   * ⑥ レスポンス
   * ----------------------------------------------------------------------- */
  return NextResponse.json({
    mode: playerId ? 'player' : 'date',
    date: targetDate,
    results,
    prevDate,
    nextDate,
  });
}

/* ============================================================================
 * POST: 対局結果の登録（matchDate + roundIndex）
 * ========================================================================== */
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
  } = body as {
    winnerId: string;
    winnerName: string;
    winnerRate: number;
    loserId: string;
    loserName: string;
    loserRate: number;
    matchDate: number;
    roundIndex: number;
  };

  if (!winnerId || !loserId || !matchDate || !roundIndex) {
    return NextResponse.json(
      { error: '必須項目が不足しています' },
      { status: 400 }
    );
  }

  try {
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
  } catch (e: unknown) {
    // Prisma のユニーク制約エラー
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: '同じ対局がすでに登録されています' },
        { status: 409 }
      );
    }

    console.error('POST /api/private/result error:', e);
    throw e;
  }
}

/* ============================================================================
 * DELETE: 対局結果の削除
 * ========================================================================== */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'id が必要です' },
      { status: 400 }
    );
  }

  await prisma.result.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}