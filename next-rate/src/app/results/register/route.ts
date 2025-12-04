import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

const K = 32;
const expectedScore = (a: number, b: number) => 1 / (1 + Math.pow(10, (b - a) / 400));
const calc = (w: number, l: number) => {
  const ew = expectedScore(w, l);
  const el = expectedScore(l, w);
  return {
    winnerNext: Math.round(w + K * (1 - ew)),
    loserNext: Math.round(l + K * (0 - el)),
  };
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect('/login');

  const formData = await req.formData();
  const winnerId = formData.get('winnerId') as string;
  const loserId = formData.get('loserId') as string;
  const playedAtStr = formData.get('playedAt') as string;

  if (!winnerId || !loserId || winnerId === loserId) {
    return NextResponse.json({ error: '勝者と敗者の選択が不正です' }, { status: 400 });
  }

  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser = await prisma.player.findUnique({ where: { id: loserId } });
  if (!winner || !loser) {
    return NextResponse.json({ error: 'プレイヤーが存在しません' }, { status: 400 });
  }

  const winnerStartRate = winner.currentRate;
  const loserStartRate = loser.currentRate;
  const { winnerNext, loserNext } = calc(winnerStartRate, loserStartRate);

  await prisma.result.create({
    data: {
      winnerId,
      loserId,
      winnerName: winner.name,
      loserName: loser.name,
      winnerRate: winnerStartRate, // 開始時点レート
      loserRate: loserStartRate,   // 開始時点レート
      playedAt: playedAtStr ? new Date(playedAtStr) : new Date(),
    },
  });

  await prisma.player.update({
    where: { id: winnerId },
    data: { currentRate: winnerNext },
  });
  await prisma.player.update({
    where: { id: loserId },
    data: { currentRate: loserNext },
  });

  redirect('/results');
}