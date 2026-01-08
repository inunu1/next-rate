// src/app/api/rating/recalculate/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const K = 32;
const expectedScore = (a: number, b: number) =>
  1 / (1 + Math.pow(10, (b - a) / 400));
const calcNext = (w: number, l: number) => {
  const ew = expectedScore(w, l);
  const el = expectedScore(l, w);
  return {
    winnerNext: Math.round(w + K * (1 - ew)),
    loserNext: Math.round(l + K * (0 - el)),
  };
};

export async function POST() {
  // 1) 全員を初期レートへリセット（メモリ上）
  const players = await prisma.player.findMany();
  const playerMap = new Map(
    players.map((p) => [p.id, { ...p, currentRate: p.initialRate }])
  );

  // 2) 残っている試合を日時昇順で取得
  const results = await prisma.result.findMany({
    orderBy: { playedAt: 'asc' },
  });

  // 更新内容をメモリに蓄積
  const resultUpdates: { id: string; winnerRate: number; loserRate: number }[] =
    [];

  // 3) 昇順リプレイ（メモリ上で計算）
  for (const r of results) {
    const winner = playerMap.get(r.winnerId);
    const loser = playerMap.get(r.loserId);
    if (!winner || !loser) continue;

    const winnerStart = winner.currentRate;
    const loserStart = loser.currentRate;

    const { winnerNext, loserNext } = calcNext(winnerStart, loserStart);

    // 開始時レートを記録
    resultUpdates.push({
      id: r.id,
      winnerRate: winnerStart,
      loserRate: loserStart,
    });

    // 適用後レートを更新（メモリ上）
    winner.currentRate = winnerNext;
    loser.currentRate = loserNext;
  }

  // 4) 一括更新（トランザクション）
  await prisma.$transaction([
    // results の開始時レート更新
    ...resultUpdates.map((u) =>
      prisma.result.update({
        where: { id: u.id },
        data: { winnerRate: u.winnerRate, loserRate: u.loserRate },
      })
    ),
    // players の最終レート更新
    ...Array.from(playerMap.values()).map((p) =>
      prisma.player.update({
        where: { id: p.id },
        data: { currentRate: p.currentRate },
      })
    ),
  ]);

  return NextResponse.json({
    message: 'レーティング再計算完了（高速化版）',
  });
}