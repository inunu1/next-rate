import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");

  if (!keyword || keyword.trim() === "") {
    return NextResponse.json([], {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // プレイヤー検索
  const players = await prisma.player.findMany({
    where: {
      deletedAt: null,
      name: {
        contains: keyword,
      },
    },
    select: {
      id: true,
      name: true,
      currentRate: true,
    },
    orderBy: { currentRate: "desc" },
  });

  const playersWithHistory = await Promise.all(
    players.map(async (p) => {
      const results = await prisma.result.findMany({
        where: {
          OR: [{ winnerId: p.id }, { loserId: p.id }],
        },
        orderBy: { playedAt: "desc" },
        take: 9, // 最新レートと合わせて10件
      });

      const history = [
        {
          rate: p.currentRate,
          playedAt: null,
          opponent: null,
          result: null,
          rateDiff: null,
        },
        ...results.map((r) => {
          const isWinner = r.winnerId === p.id;

          const rate = isWinner ? r.winnerRate : r.loserRate;
          const opponent = isWinner ? r.loserName : r.winnerName;

          const rateDiff = isWinner
            ? r.winnerRate - r.loserRate
            : r.loserRate - r.winnerRate;

          return {
            rate,
            playedAt: r.playedAt,
            opponent,
            result: isWinner ? "○" : "●",
            rateDiff,
          };
        }),
      ];

      return {
        ...p,
        history,
      };
    })
  );

  return NextResponse.json(playersWithHistory, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}