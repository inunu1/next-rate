import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect('/login');

  const form = await req.formData();
  const id = form.get('id')?.toString();

  if (!id || id === session.user.id) return redirect('/players?error=E104');

  await prisma.player.update({
    where: { id },
    data: { deletedAt: new Date() }, // ← 論理削除
  });

  return redirect('/players');
}