import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PlayersPage() {
  const user = await getSessionUser();
  if (!user) return <meta httpEquiv="refresh" content="0;url=/login" />;

  const players = await prisma.player.findMany();

  return (
    <main>
      <header>
        <h1>対局者管理画面</h1>
        <Link href="/dashboard">Dashboard</Link>
      </header>

      <form method="POST" action="/players/register">
        <input name="name" type="text" placeholder="ユーザー名" required maxLength={50} />
        <input name="initialRate" type="number" placeholder="初期レート（4桁）" required min={1000} max={9999} />
        <button type="submit">登録</button>
      </form>

      <table>
        <thead>
          <tr><th>プレイヤー名</th><th>現在レート</th><th>初期レート</th><th>操作</th></tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.currentRate}</td>
              <td>{p.initialRate}</td>
              <td>
                {p.id !== user.id && (
                  <form method="POST" action="/players/update">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="number" name="currentRate" placeholder="新レート" required min={1000} max={9999} />
                    <button type="submit">編集</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}