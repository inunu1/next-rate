export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ResultsClient from './ResultsClient';

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const players = await prisma.player.findMany({ where: { deletedAt: null } });
  const results = await prisma.result.findMany({ orderBy: { playedAt: 'desc' } });

  return <ResultsClient players={players} results={results} />;
}