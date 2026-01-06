import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/players/:id → 論理削除にも使う
export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // /players/123 → 123

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  // 論理削除
  if (body?.deleted === true) {
    const player = await prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, player });
  }

  return NextResponse.json(
    { error: "Unsupported PUT operation" },
    { status: 400 }
  );
}