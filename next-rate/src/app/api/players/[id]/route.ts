import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/players/:id
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.player.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const form = await req.formData();
  const name = form.get("name")?.toString() ?? "";
  const initialRate = Number(form.get("initialRate"));

  const player = await prisma.player.update({
    where: { id: params.id },
    data: { name, initialRate },
  });

  return NextResponse.json(player);
}