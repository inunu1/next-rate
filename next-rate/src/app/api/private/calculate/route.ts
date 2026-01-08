import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
  // 🔒 認証チェック（privert API の必須条件）
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1) 全員を初期レートへリセット（メモリ上）
  const players = await prisma.player.findMany();
  const playerMap = new Map(
    players.map((p) => [p.id, { ...p, currentRate: p.initialRate }])
  );

  // 2) 残っている試合を日時昇順で取得
  const results = await prisma.result.findMany({
    orderBy: { playedAt: 'asc' },
  });

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

    resultUpdates.push({
      id: r.id,
      winnerRate: winnerStart,
      loserRate: loserStart,
    });

    winner.currentRate = winnerNext;
    loser.currentRate = loserNext;
  }

  // 4) 一括更新（トランザクション）
  await prisma.$transaction([
    ...resultUpdates.map((u) =>
      prisma.result.update({
        where: { id: u.id },
        data: { winnerRate: u.winnerRate, loserRate: u.loserRate },
      })
    ),
    ...Array.from(playerMap.values()).map((p) =>
      prisma.player.update({
        where: { id: p.id },
        data: { currentRate: p.currentRate },
      })
    ),
  ]);

  return NextResponse.json({
    message: 'レーティング計算完了',
  });
}