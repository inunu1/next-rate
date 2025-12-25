import TrendClient from './TrendClient';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TrendPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const players = await prisma.player.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return <TrendClient players={players} />;
}