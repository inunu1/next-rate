import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = formData.get('id') as string;
  const banned = formData.get('banned') !== null; // チェックが入っているかどうか

  await prisma.player.update({
    where: { id },
    data: {
      deletedAt: banned ? new Date() : null,
    },
  });

  return NextResponse.redirect('/players');
}