/**
 * ============================================================================
 * API 名：/api/private/result
 * 概要　：対局結果の取得・登録・削除（ORM 版）
 * 層区分：Controller（業務ロジックは最小限）
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ---------------------------------------------------------------------------
 * ローカル日付 YYYY-MM-DD を生成
 * --------------------------------------------------------------------------- */
function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ============================================================================
 * GET /api/private/result
 * ============================================================================
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const playerId = searchParams.get('playerId');
    const dateParam = searchParams.get('date');

    /* ------------------------------------------------------------------------
     * 1. 最新日付の取得（date 指定なしの場合）
     * ------------------------------------------------------------------------ */
    const latest = await prisma.result.findFirst({
      orderBy: { playedAt: 'desc' },
      select: { playedAt: true },
    });

    if (!latest) {
      return NextResponse.json({
        mode: playerId ? 'player' : 'date',
        date: null,
        results: [],
        prevDate: null,
        nextDate: null,
      });
    }

    const latestDate = formatLocalDate(latest.playedAt);

    /* ------------------------------------------------------------------------
     * 2. 対象日付の決定（単日検索対応）
     * ------------------------------------------------------------------------ */
    const targetDate = dateParam ?? latestDate;

    /* ------------------------------------------------------------------------
     * 3. 対象日の対局取得（4パターン）
     * ------------------------------------------------------------------------ */
    const results = await prisma.result.findMany({
      where: {
        playedAt: {
          gte: new Date(`${targetDate}T00:00:00`),
          lt: new Date(`${targetDate}T23:59:59`),
        },
        ...(playerId
          ? {
              OR: [
                { winnerId: playerId },
                { loserId: playerId },
              ],
            }
          : {}),
      },
      orderBy: { playedAt: 'desc' },
    });

    /* ------------------------------------------------------------------------
     * 4. 前後の日付（空の日スキップ）
     * ------------------------------------------------------------------------ */
    const prev = await prisma.result.findFirst({
      where: {
        playedAt: { lt: new Date(`${targetDate}T00:00:00`) },
        ...(playerId
          ? {
              OR: [
                { winnerId: playerId },
                { loserId: playerId },
              ],
            }
          : {}),
      },
      orderBy: { playedAt: 'desc' },
      select: { playedAt: true },
    });

    const next = await prisma.result.findFirst({
      where: {
        playedAt: { gt: new Date(`${targetDate}T23:59:59`) },
        ...(playerId
          ? {
              OR: [
                { winnerId: playerId },
                { loserId: playerId },
              ],
            }
          : {}),
      },
      orderBy: { playedAt: 'asc' },
      select: { playedAt: true },
    });

    /* ------------------------------------------------------------------------
     * 5. レスポンス返却
     * ------------------------------------------------------------------------ */
    return NextResponse.json({
      mode: playerId ? 'player' : 'date',
      date: targetDate,
      results,
      prevDate: prev ? formatLocalDate(prev.playedAt) : null,
      nextDate: next ? formatLocalDate(next.playedAt) : null,
    });
  } catch (err) {
    console.error('GET /api/private/result error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

/* ============================================================================
 * POST /api/private/result
 * ============================================================================
 */
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

    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/private/result error:', err);
    return NextResponse.json(
      { error: 'Failed to create result' },
      { status: 500 }
    );
  }
}

/* ============================================================================
 * DELETE /api/private/result?id=xxxx
 * ============================================================================
 */
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/private/result error:', err);
    return NextResponse.json(
      { error: 'Failed to delete result' },
      { status: 500 }
    );
  }
}