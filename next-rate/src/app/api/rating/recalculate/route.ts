// src/app/api/rating/recalculate/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const K = 32;
const expectedScore = (a: number, b: number) => 1 / (1 + Math.pow(10, (b - a) / 400));
const calcNext = (w: number, l: number) => {
  const ew = expectedScore(w, l);
  const el = expectedScore(l, w);
  return {
    winnerNext: Math.round(w + K * (1 - ew)),
    loserNext: Math.round(l + K * (0 - el)),
  };
};

export async function POST() {
  // 1) 全員を初期レートへリセット
  const players = await prisma.player.findMany();
  for (const p of players) {
    await prisma.player.update({
      where: { id: p.id },
      data: { currentRate: p.initialRate },
    });
  }

  // 2) 残っている試合のみを日時昇順で取得
  const results = await prisma.result.findMany({
    orderBy: { playedAt: 'asc' },
  });

  // 3) 昇順リプレイで開始時レートをresultsへ、適用後レートをplayersへ
  for (const r of results) {
    const winner = await prisma.player.findUnique({ where: { id: r.winnerId } });
    const loser  = await prisma.player.findUnique({ where: { id: r.loserId } });
    if (!winner || !loser) continue;

    const winnerStart = winner.currentRate; // 試合開始時点（適用前）
    const loserStart  = loser.currentRate;

    const { winnerNext, loserNext } = calcNext(winnerStart, loserStart);

    // 開始時点レートを results に上書き（表示用は常に開始時）
    await prisma.result.update({
      where: { id: r.id },
      data: {
        winnerRate: winnerStart,
        loserRate:  loserStart,
      },
    });

    // 適用後レートを players に反映
    await prisma.player.update({
      where: { id: winner.id },
      data: { currentRate: winnerNext },
    });
    await prisma.player.update({
      where: { id: loser.id },
      data: { currentRate: loserNext },
    });
  }

  return NextResponse.json({ message: 'レーティング再計算完了（開始時レート再構築）' });
}