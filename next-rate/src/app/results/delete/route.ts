import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect('/login');

  const formData = await req.formData();
  const resultId = formData.get('id') as string;

  const result = await prisma.result.findUnique({ where: { id: resultId } });
  if (!result) {
    return NextResponse.json({ error: '試合IDが見つかりません' }, { status: 400 });
  }

  await prisma.result.delete({ where: { id: resultId } });
  redirect('/results');
}