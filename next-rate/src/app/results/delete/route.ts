import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect('/login');

  const form = await req.formData();
  const id = form.get('id')?.toString();

  if (!id) return redirect('/results?error=E103');

  await prisma.result.delete({ where: { id } });

  return redirect('/results');
}