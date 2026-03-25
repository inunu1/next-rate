import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ============================================================================
 * Utility: YYYY-MM-DD → matchDate(Int)
 * ========================================================================== */
function toMatchDate(dateStr: string): number {
  return Number(dateStr.replaceAll("-", ""));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const keyword = searchParams.get("keyword");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  /* ==========================================================================
   * ① 日付検索モード（keyword が空でも OK）
   * ======================================================================== */
  if ((!keyword || keyword.trim() === "") && (from || to)) {
    const dateFilter: { gte?: number; lte?: number } = {};

    if (from) dateFilter.gte = toMatchDate(from);
    if (to) dateFilter.lte = toMatchDate(to);

    const results = await prisma.result.findMany({
      where: {
        matchDate: dateFilter,
      },
      orderBy: [
        { matchDate: "desc" },
        { roundIndex: "desc" },
      ],
    });

    return NextResponse.json(results, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  /* ==========================================================================
   * ② keyword も日付も空 → 空配列
   * ======================================================================== */
  if (!keyword || keyword.trim() === "") {
    return NextResponse.json([], {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  /* ==========================================================================
   * ③ プレイヤー検索
   * ======================================================================== */
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

  /* ==========================================================================
   * ④ 各プレイヤーの対局履歴取得
   * ======================================================================== */
  const playersWithHistory = await Promise.all(
    players.map(async (p) => {
      const dateFilter: { gte?: number; lte?: number } = {};
      if (from) dateFilter.gte = toMatchDate(from);
      if (to) dateFilter.lte = toMatchDate(to);

      const results = await prisma.result.findMany({
        where: {
          OR: [{ winnerId: p.id }, { loserId: p.id }],
          ...(from || to ? { matchDate: dateFilter } : {}),
        },
        orderBy: [
          { matchDate: "desc" },
          { roundIndex: "desc" },
        ],
        take: from || to ? undefined : 9,
      });

      const history = [
        {
          rate: p.currentRate,
          matchDate: null,
          roundIndex: null,
          opponent: null,
          opponentRate: null,
          result: null,
        },
        ...results.map((r) => {
          const isWinner = r.winnerId === p.id;
          return {
            rate: isWinner ? r.winnerRate : r.loserRate,
            matchDate: r.matchDate,
            roundIndex: r.roundIndex,
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