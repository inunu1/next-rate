import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = formData.get('id') as string;

  if (!id) {
    return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
  }

  await prisma.result.delete({
    where: { id },
  });

  // 削除後は一覧へリダイレクト
  return redirect('/results');
}