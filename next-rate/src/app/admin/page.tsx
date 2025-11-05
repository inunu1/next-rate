import AdminClient from './AdminClient';
import { prisma } from '@/lib/prisma';
import { AdminUser } from '@/types/admin';

export default async function AdminPage() {
  const users: AdminUser[] = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return <AdminClient users={users} />;
}