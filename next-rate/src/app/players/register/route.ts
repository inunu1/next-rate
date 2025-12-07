import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = form.get("name")?.toString() ?? "";
  const initialRate = parseInt(form.get("initialRate")?.toString() ?? "0", 10);

  if (!name || isNaN(initialRate)) return redirect("/players?error=E101");

  const exists = await prisma.player.findUnique({ where: { name } });
  if (exists) return redirect("/players?error=E103");

  await prisma.player.create({
    data: {
      name,
      initialRate,
      currentRate: initialRate,
    },
  });

  return redirect("/players");
}