import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const form = await req.formData();

  const name = form.get("name")?.toString() ?? "";
  const initialRate = Number(form.get("initialRate"));

  const player = await prisma.player.update({
    where: { id },
    data: { name, initialRate },
  });

  return NextResponse.json(player);
}