import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // ▼ 日付検索モード（keyword が空でも OK）
  if ((!keyword || keyword.trim() === "") && (from || to)) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const results = await prisma.result.findMany({
      where: {
        playedAt: dateFilter,
      },
      orderBy: { playedAt: "desc" },
    });

    return NextResponse.json(results, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // ▼ keyword も日付も空 → 空配列
  if (!keyword || keyword.trim() === "") {
    return NextResponse.json([], {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // ▼ プレイヤー検索
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
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);

      const results = await prisma.result.findMany({
        where: {
          OR: [{ winnerId: p.id }, { loserId: p.id }],
          ...(from || to ? { playedAt: dateFilter } : {}),
        },
        orderBy: { playedAt: "desc" },
        take: from || to ? undefined : 9,
      });

      const history = [
        {
          rate: p.currentRate,
          playedAt: null,
          opponent: null,
          opponentRate: null,
          result: null,
        },
        ...results.map((r) => {
          const isWinner = r.winnerId === p.id;
          return {
            rate: isWinner ? r.winnerRate : r.loserRate,
            playedAt: r.playedAt,
            opponent: isWinner ? r.loserName : r.winnerName,
            opponentRate: isWinner ? r.loserRate : r.winnerRate,
            result: isWinner ? "○" : "●",
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