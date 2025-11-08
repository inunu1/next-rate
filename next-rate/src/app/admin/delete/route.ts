// src/app/admin/delete/route.ts
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = formData.get('id') as string;

  if (!id) {
    redirect('/admin?error=missing_id');
  }

  await prisma.user.delete({
    where: { id },
  });

  redirect('/admin'); // ✅ 削除後に一覧へ戻る
}