export const dynamic = 'force-dynamic'; // ✅ これを追加

import AdminClient from './AdminClient';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return <AdminClient users={users} />;
}