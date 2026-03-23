import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 日付を YYYY-MM-DD に整形
function formatLocalDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const date = searchParams.get('date');        // ← 必ず先に取得
  const playerId = searchParams.get('playerId');

  // ============================================================
  // ① 最新日付の決定ロジック（今回の修正ポイント）
  // ============================================================

  let latestDateRecord;

  if (!date && playerId) {
    // ▼ プレイヤー検索モードの初期表示
    //    → そのプレイヤーの最新対局日を返す
    latestDateRecord = await prisma.result.findFirst({
      where: {
        OR: [
          { winnerId: playerId },
          { loserId: playerId },
        ],
      },
      orderBy: { playedAt: 'desc' },
      select: { playedAt: true },
    });
  } else {
    // ▼ 通常モード
    latestDateRecord = await prisma.result.findFirst({
      orderBy: { playedAt: 'desc' },
      select: { playedAt: true },
    });
  }

  if (!latestDateRecord) {
    return NextResponse.json({
      mode: playerId ? 'player' : 'date',
      date: null,
      results: [],
      prevDate: null,
      nextDate: null,
    });
  }

  const latestDate = formatLocalDate(latestDateRecord.playedAt);

  // ============================================================
  // ② 中心日付（targetDate）の決定
  // ============================================================
  const targetDate = date ?? latestDate;

  // ============================================================
  // ③ 対局データの取得
  // ============================================================
  const results = await prisma.result.findMany({
    where: {
      playedAt: {
        gte: new Date(`${targetDate}T00:00:00`),
        lte: new Date(`${targetDate}T23:59:59`),
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
    orderBy: { playedAt: 'asc' },
  });

  // ============================================================
  // ④ prevDate（前に対局があった日）
  // ============================================================
  const prevRecord = await prisma.result.findFirst({
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

  const prevDate = prevRecord ? formatLocalDate(prevRecord.playedAt) : null;

  // ============================================================
  // ⑤ nextDate（次に対局があった日）
  // ============================================================
  const nextRecord = await prisma.result.findFirst({
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

  const nextDate = nextRecord ? formatLocalDate(nextRecord.playedAt) : null;

  // ============================================================
  // ⑥ レスポンス
  // ============================================================
  return NextResponse.json({
    mode: playerId ? 'player' : 'date',
    date: targetDate,
    results,
    prevDate,
    nextDate,
  });
}