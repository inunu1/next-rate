import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/players
// 対局者一覧を返す
export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(players);
}

// POST /api/players
// 新規プレイヤー作成
export async function POST(req: Request) {
  const form = await req.formData();
  const name = form.get("name")?.toString() ?? "";
  const initialRate = Number(form.get("initialRate"));

  if (!name || isNaN(initialRate)) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  const exists = await prisma.player.findUnique({
    where: { name },
  });

  if (exists) {
    return NextResponse.json(
      { error: "Player already exists" },
      { status: 409 }
    );
  }

  const player = await prisma.player.create({
    data: {
      name,
      initialRate,
      currentRate: initialRate,
    },
  });

  return NextResponse.json(player, { status: 201 });
}