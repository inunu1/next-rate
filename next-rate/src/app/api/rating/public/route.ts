import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");

  // keyword が無い場合は全件返さず、空配列を返す（安全）
  if (!keyword || keyword.trim() === "") {
    return NextResponse.json([], {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const players = await prisma.player.findMany({
    where: {
      name: {
        contains: keyword,
      },
    },
    select: {
      id: true,
      name: true,
      currentRate: true,
      initialRate: true,
    },
    orderBy: { currentRate: "desc" },
  });

  return NextResponse.json(players, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}