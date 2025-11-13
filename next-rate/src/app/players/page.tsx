export const dynamic = 'force-dynamic';

import PlayersClient from './PlayersClient';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const currentUserId = session.user.id;

  const players = await prisma.player.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return <PlayersClient players={players} currentUserId={currentUserId} />;
}