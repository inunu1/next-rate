import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ResultsClient from './ResultsClient';
import type { Result as PrismaResult } from '@prisma/client';

type ResultWithDate = Omit<PrismaResult, 'playedAt'> & {
  playedAt: Date;
};

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const players = await prisma.player.findMany({
    where: { deletedAt: null },
  });

  const rawResults = await prisma.result.findMany({
    orderBy: { playedAt: 'desc' },
  });

  const results: ResultWithDate[] = rawResults.map((r) => ({
    ...r,
    playedAt: new Date(r.playedAt),
  }));

  return <ResultsClient players={players} results={results} />;
}