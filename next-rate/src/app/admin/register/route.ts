import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const form = await req.formData();
  const email = form.get('email') as string | null;
  const name = form.get('name') as string | null;
  const password = form.get('password') as string | null;

  // 入力チェック
  if (!email || !password || !name) {
    return redirect('/admin?error=missing');
  }

  // email 重複チェック
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return redirect('/admin?error=duplicate');
  }

  // パスワードハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  // 登録
  await prisma.user.create({
    data: {
      email,
      name,
      hashedPassword,
    },
  });

  return redirect('/admin?success=1');
}