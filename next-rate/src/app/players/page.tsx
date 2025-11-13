import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlayersClient from "./PlayersClient";

export default async function PlayersPage() {
  const user = await getSessionUser();
  if (!user) return <meta httpEquiv="refresh" content="0;url=/login" />;

  const players = await prisma.player.findMany();

  return <PlayersClient players={players} currentUserId={user.id} />;
}