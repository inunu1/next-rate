import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = formData.get('id') as string;

  if (!id) return redirect('/results');

  await prisma.result.delete({ where: { id } });

  // ✅ 削除後にレーティング再計算 API を呼ぶ
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rating/recalculate`, {
    method: 'POST',
  });

  redirect('/results');
}