export const dynamic = 'force-dynamic';

import AdminClient from './AdminClient';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? '';

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return <AdminClient users={users} currentUserId={currentUserId} />;
}