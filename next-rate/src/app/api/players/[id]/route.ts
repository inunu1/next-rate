import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/players/:id
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // /api/players/123 → "123"

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await prisma.player.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

// PUT /api/players/:id
export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const form = await req.formData();
  const name = form.get("name")?.toString() ?? "";
  const initialRate = Number(form.get("initialRate"));

  const player = await prisma.player.update({
    where: { id },
    data: { name, initialRate },
  });

  return NextResponse.json(player);
}