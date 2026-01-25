import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ResultsClient from './ResultsClient';
import type { Player, Result } from '@prisma/client';

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const players: Player[] = await prisma.player.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });

  // リレーションは使わず、Result のみ取得
  const results: Result[] = await prisma.result.findMany({
    where: { archivedAt: null },
    orderBy: { playedAt: 'desc' },
  });

  return <ResultsClient players={players} results={results} />;
}