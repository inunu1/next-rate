import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/admin?error=missing');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, name, hashedPassword },
  });

  redirect('/admin');
}