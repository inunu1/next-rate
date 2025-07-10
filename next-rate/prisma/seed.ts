// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const plainPassword = 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10); // ここでハッシュ化

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'テストユーザー',
      hashedPassword: hashedPassword, // ここをハードコードではなく変数に
    },
  });

  console.log('✅ テストユーザーを作成しました');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
