import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const formData = await req.formData();
  const winnerId = formData.get('winnerId') as string;
  const loserId = formData.get('loserId') as string;
  const playedAt = formData.get('playedAt') as string;

  if (!winnerId || !loserId || !playedAt || winnerId === loserId) {
    throw new Error('入力値が不正です');
  }

  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser = await prisma.player.findUnique({ where: { id: loserId } });

  if (!winner || !loser) {
    throw new Error('プレイヤーが存在しません');
  }

  await prisma.result.create({
    data: {
      winnerId,
      loserId,
      playedAt: new Date(playedAt),
      winnerName: winner.name,
      winnerRate: winner.currentRate,
      loserName: loser.name,
      loserRate: loser.currentRate,
    },
  });

  return redirect('/results');
}