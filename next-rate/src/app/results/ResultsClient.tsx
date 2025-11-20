'use client';

import type { Result as PrismaResult } from '@prisma/client';
import { useMemo } from 'react';

type ResultWithDate = Omit<PrismaResult, 'playedAt'> & {
  playedAt: Date;
};

type Props = {
  results: ResultWithDate[];
};

export default function ResultsClient({ results }: Props) {
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
    </main>
  );
}