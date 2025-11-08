import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const formData = await req.formData();
  const id = formData.get('id') as string;

  if (!id || id === currentUserId) {
    redirect('/admin?error=cannot_delete_self');
  }

  await prisma.user.delete({
    where: { id },
  });

  redirect('/admin');
}