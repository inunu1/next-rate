'use client';

import type { Player, Result as PrismaResult } from '@prisma/client';
import { useMemo } from 'react';

type ResultWithDate = Omit<PrismaResult, 'playedAt'> & {
  playedAt: Date;
};

type Props = {
  players: Player[];
  results: ResultWithDate[];
};

export default function ResultsClient({ players, results }: Props) {
  const formattedResults = useMemo(() => {
    return results.map((r) => ({
      ...r,
      playedAtFormatted: r.playedAt.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }, [results]);

  return (
    <main>
      <header>
        <h1>対局管理</h1>
        <form action="/dashboard" method="get">
          <button type="submit">Dashboardへ</button>
        </form>
      </header>

      <section>
        <h2>新規対局登録</h2>
        <form action="/results/register" method="post">
          <label>
            勝者:
            <select name="winnerId" required>
              <option value="">選択してください</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            敗者:
            <select name="loserId" required>
              <option value="">選択してください</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">登録</button>
        </form>
      </section>

      <section>
        <h2>試合結果一覧</h2>
        <table>
          <thead>
            <tr>
              <th>日時</th>
              <th>勝者</th>
              <th>敗者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {formattedResults.map((r) => (
              <tr key={r.id}>
                <td>{r.playedAtFormatted}</td>
                <td>{r.winnerName}（{r.winnerRate}）</td>
                <td>{r.loserName}（{r.loserRate}）</td>
                <td>
                  <form action="/results/delete" method="post">
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit">削除</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}