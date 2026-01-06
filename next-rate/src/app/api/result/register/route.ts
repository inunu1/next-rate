// src/app/results/register/route.ts
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
  const loserId  = formData.get('loserId')  as string;
  const playedAtStr = formData.get('playedAt') as string;

  if (!winnerId || !loserId || winnerId === loserId) {
    return NextResponse.json({ error: '勝者と敗者の選択が不正です' }, { status: 400 });
  }

  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser  = await prisma.player.findUnique({ where: { id: loserId } });
  if (!winner || !loser) {
    return NextResponse.json({ error: 'プレイヤーが存在しません' }, { status: 400 });
  }

  // 登録時は「開始時レート」は保存しない（再計算が正で上書きする）
  await prisma.result.create({
    data: {
      winnerId,
      loserId,
      winnerName: winner.name,
      loserName: loser.name,
      // 開始時表示用フィールドは再計算で上書きされる前提
      winnerRate: winner.currentRate, // 置いても良いが、最終的に再計算で正値に上書きされる
      loserRate:  loser.currentRate,
      playedAt: playedAtStr ? new Date(playedAtStr) : new Date(),
    },
  });

  // 登録直後に必ず再計算
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rating/recalculate`, { method: 'POST' });

  redirect('/results');
}