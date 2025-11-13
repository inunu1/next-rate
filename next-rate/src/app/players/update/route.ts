import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return redirect("/login");

  const form = await req.formData();
  const id = form.get("id")?.toString();
  const currentRate = parseInt(form.get("currentRate")?.toString() ?? "0", 10);

  if (!id || isNaN(currentRate)) return redirect("/players?error=E104");
  if (id === user.id) return redirect("/players?error=E104");

  await prisma.player.update({
    where: { id },
    data: { currentRate },
  });

  return redirect("/players");
}