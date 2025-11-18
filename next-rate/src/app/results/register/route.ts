import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect('/login');

  const form = await req.formData();
  const winnerId = form.get('winnerId')?.toString();
  const loserId = form.get('loserId')?.toString();

  if (!winnerId || !loserId || winnerId === loserId) return redirect('/results?error=E101');

  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser = await prisma.player.findUnique({ where: { id: loserId } });

  if (!winner || !loser) return redirect('/results?error=E102');

  await prisma.result.create({
    data: {
      winnerId,
      winnerName: winner.name,
      winnerRate: winner.currentRate,
      loserId,
      loserName: loser.name,
      loserRate: loser.currentRate,
    },
  });

  await prisma.player.update({
    where: { id: winnerId },
    data: { currentRate: winner.currentRate + 16 },
  });

  await prisma.player.update({
    where: { id: loserId },
    data: { currentRate: loser.currentRate - 16 },
  });

  return redirect('/results');
}