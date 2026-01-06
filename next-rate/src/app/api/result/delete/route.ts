// src/app/results/delete/route.ts
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = formData.get('id') as string;
  if (!id) return redirect('/results');

  await prisma.result.delete({ where: { id } });

  // 削除直後に必ず再計算
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rating/recalculate`, { method: 'POST' });

  redirect('/results');
}