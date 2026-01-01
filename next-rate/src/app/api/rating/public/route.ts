import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const players = await prisma.player.findMany({
    where: {
      deletedAt: null, // 論理削除されていないプレイヤーのみ
    },
    orderBy: {
      createdAt: "asc", // 並び順は必要に応じて変更
    },
    select: {
      id: true,
      name: true,
      initialRate: true,
      currentRate: true,
      createdAt: true,
    },
  });

  return new NextResponse(JSON.stringify(players), {
    headers: {
      "Access-Control-Allow-Origin": "*", // 必要なら GitHub Pages の URL に限定
      "Access-Control-Allow-Methods": "GET",
    },
  });
}