import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ローカル日付としてパースする（UTCズレ防止） */
function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/* ローカル日付 YYYY-MM-DD を生成 */
function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ========================================================================
 * GET /api/result
 * ======================================================================== */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const dateParam = searchParams.get('date');
    const winner = searchParams.get('winner');
    const loser = searchParams.get('loser');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const hasSearch =
      (winner && winner.trim() !== '') ||
      (loser && loser.trim() !== '') ||
      from ||
      to;

    /* --------------------------------------------------------------------
     * 1. 検索モード
     * -------------------------------------------------------------------- */
    if (hasSearch) {
      const where: {
        winnerName?: { contains: string };
        loserName?: { contains: string };
        playedAt?: {gte?: Date;lte?: Date;};
      } = {};

      if (winner) where.winnerName = { contains: winner };
      if (loser) where.loserName = { contains: loser };

      if (from || to) {
        where.playedAt = {};
        if (from) where.playedAt.gte = new Date(from);
        if (to) where.playedAt.lte = new Date(to);
      }

      const results = await prisma.result.findMany({
        where,
        orderBy: { playedAt: 'desc' },
      });

      return NextResponse.json({
        mode: 'search',
        results,
      });
    }

    /* --------------------------------------------------------------------
     * 2. 日付ページネーションモード
     * -------------------------------------------------------------------- */

    const latest = await prisma.result.findFirst({
      orderBy: { playedAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json({
        mode: 'date',
        date: null,
        results: [],
        prevDate: null,
        nextDate: null,
      });
    }

    // ★ latest.playedAt をローカル日付に変換
    const latestLocalDate = formatLocalDate(latest.playedAt);

    // ★ dateParam もローカル日付として扱う
    const targetDate = dateParam
      ? parseLocalDate(dateParam)
      : parseLocalDate(latestLocalDate);

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const results = await prisma.result.findMany({
      where: {
        playedAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { playedAt: 'desc' },
    });

    const prev = await prisma.result.findFirst({
      where: { playedAt: { lt: start } },
      orderBy: { playedAt: 'desc' },
    });

    const next = await prisma.result.findFirst({
      where: { playedAt: { gt: end } },
      orderBy: { playedAt: 'asc' },
    });

    return NextResponse.json({
      mode: 'date',
      date: formatLocalDate(start), // ★ UTC を使わない
      results,
      prevDate: prev ? formatLocalDate(prev.playedAt) : null,
      nextDate: next ? formatLocalDate(next.playedAt) : null,
    });
  } catch (err) {
    console.error('GET /api/result error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

/* ========================================================================
 * POST /api/result
 * ======================================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      !body.winnerId ||
      !body.winnerName ||
      !body.loserId ||
      !body.loserName ||
      !body.playedAt
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const playedAt = new Date(body.playedAt);

    const created = await prisma.result.create({
      data: {
        winnerId: body.winnerId,
        winnerName: body.winnerName,
        winnerRate: body.winnerRate,
        loserId: body.loserId,
        loserName: body.loserName,
        loserRate: body.loserRate,
        playedAt,
      },
    });

    await prisma.result.updateMany({
      where: { playedAt: { gte: playedAt } },
      data: { isCalculated: false },
    });

    await fetch('/api/private/calculate', {
      method: 'POST',
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/result error:', err);
    return NextResponse.json(
      { error: 'Failed to create result' },
      { status: 500 }
    );
  }
}

/* ========================================================================
 * DELETE /api/result?id=xxxx
 * ======================================================================== */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      );
    }

    const target = await prisma.result.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    await prisma.result.delete({ where: { id } });

    await prisma.result.updateMany({
      where: { playedAt: { gte: target.playedAt } },
      data: { isCalculated: false },
    });

    await fetch('/api/private/calculate', {
      method: 'POST',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/result error:', err);
    return NextResponse.json(
      { error: 'Failed to delete result' },
      { status: 500 }
    );
  }
}