import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get('email') as string | null;
  const name = formData.get('name') as string | null;
  const password = formData.get('password') as string | null;

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