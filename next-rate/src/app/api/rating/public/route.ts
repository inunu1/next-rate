import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");

  // keyword が無い場合は空配列（安全）
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

  // 各プレイヤーの過去10局のレート履歴を取得
  const playersWithHistory = await Promise.all(
    players.map(async (p) => {
      const results = await prisma.result.findMany({
        where: {
          OR: [
            { winnerId: p.id },
            { loserId: p.id }
          ]
        },
        orderBy: { playedAt: "desc" },
        take: 10,
      });

      // レート履歴を整形
      const history = results.map((r) => {
        const rate = r.winnerId === p.id ? r.winnerRate : r.loserRate;
        return {
          rate,
          playedAt: r.playedAt,
        };
      });

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