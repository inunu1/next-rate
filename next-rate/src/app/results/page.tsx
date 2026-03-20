import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ResultsClient from './ResultsClient';
import type { Player, Result } from '@prisma/client';

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  // プレイヤー一覧（削除されていないもの）
  const players: Player[] = await prisma.player.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });
  
  return <ResultsClient players={players}/>;
}