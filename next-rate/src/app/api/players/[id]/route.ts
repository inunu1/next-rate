import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE は context を受け取れる
export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  await prisma.player.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

// PUT は context を受け取れない（Next.js の仕様）
export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // /api/players/123 → "123"

  const form = await req.formData();
  const name = form.get("name")?.toString() ?? "";
  const initialRate = Number(form.get("initialRate"));

  const player = await prisma.player.update({
    where: { id },
    data: { name, initialRate },
  });

  return NextResponse.json(player);
}