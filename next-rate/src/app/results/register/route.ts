import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect('/login');

  const formData = await req.formData();
  const winnerId = formData.get('winnerId') as string;
  const loserId = formData.get('loserId') as string;

  if (!winnerId || !loserId) {
    return NextResponse.json({ error: 'E203: 勝者と敗者を選択してください' }, { status: 400 });
  }
  if (winnerId === loserId) {
    return NextResponse.json({ error: 'E203: 勝者と敗者は同一にできません' }, { status: 400 });
  }

  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser = await prisma.player.findUnique({ where: { id: loserId } });

  if (!winner || !loser) {
    return NextResponse.json({ error: 'E204: プレイヤーが存在しません' }, { status: 400 });
  }

  // レート計算は仮でそのまま保持（将来拡張可能）
  await prisma.result.create({
    data: {
      winnerId,
      loserId,
      winnerName: winner.name,
      loserName: loser.name,
      winnerRate: winner.currentRate,
      loserRate: loser.currentRate,
      playedAt: new Date(),
    },
  });

  redirect('/results');
}