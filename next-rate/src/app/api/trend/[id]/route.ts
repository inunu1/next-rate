import { prisma } from '@/lib/prisma';

export async function GET(req: Request, context: unknown) {
  // ここで型を絞る（TS も ESLint も Next.js も OK）
  const { id } = (context as { params: { id: string } }).params;

  const results = await prisma.result.findMany({
    where: {
      OR: [
        { winnerId: id },
        { loserId: id },
      ],
    },
    orderBy: { playedAt: 'asc' },
  });

  const history = results.map((r) => ({
    date: r.playedAt.toISOString().slice(0, 10),
    rate: r.winnerId === id ? r.winnerRate : r.loserRate,
  }));

  return Response.json(history);
}