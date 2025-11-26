import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const K = 32;

function expectedScore(rA: number, rB: number) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

function calculateNewRatings(winnerRate: number, loserRate: number) {
  const expectedWinner = expectedScore(winnerRate, loserRate);
  const expectedLoser = expectedScore(loserRate, winnerRate);

  const newWinnerRate = Math.round(winnerRate + K * (1 - expectedWinner));
  const newLoserRate = Math.round(loserRate + K * (0 - expectedLoser));

  return { newWinnerRate, newLoserRate };
}

export async function POST() {
  // 初期レートを全プレイヤーに復元
  const players = await prisma.player.findMany();
  for (const player of players) {
    await prisma.player.update({
      where: { id: player.id },
      data: { currentRate: player.initialRate },
    });
  }

  // 試合履歴を日時順に取得
  const results = await prisma.result.findMany({
    orderBy: { playedAt: 'asc' },
  });

  // 試合順にレートを再計算
  for (const result of results) {
    const winner = await prisma.player.findUnique({ where: { id: result.winnerId } });
    const loser = await prisma.player.findUnique({ where: { id: result.loserId } });

    if (!winner || !loser) continue;

    const { newWinnerRate, newLoserRate } = calculateNewRatings(
      winner.currentRate,
      loser.currentRate
    );

    await prisma.player.update({
      where: { id: winner.id },
      data: { currentRate: newWinnerRate },
    });

    await prisma.player.update({
      where: { id: loser.id },
      data: { currentRate: newLoserRate },
    });
  }

  return NextResponse.json({ message: 'レーティング再計算完了' });
}