import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const playerId = params.id;

  const results = await prisma.result.findMany({
    where: {
      OR: [
        { winnerId: playerId },
        { loserId: playerId },
      ],
    },
    orderBy: { playedAt: 'asc' },
  });

  const history = results.map((r) => ({
    date: r.playedAt.toISOString().slice(0, 10),
    rate: r.winnerId === playerId ? r.winnerRate : r.loserRate,
  }));

  return Response.json(history);
}