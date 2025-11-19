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
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold">登録プレイヤー一覧</h2>
        <ul className="grid grid-cols-2 gap-2 mt-2">
          {players.map((p) => (
            <li key={p.id} className="text-sm text-gray-700 border p-2 rounded">
              {p.name}（初期: {p.initialRate} / 現在: {p.currentRate}）
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">試合結果一覧</h2>
        <ul className="space-y-2 mt-2">
          {formattedResults.map((r) => (
            <li key={r.id} className="border p-4 rounded shadow">
              <div className="font-semibold">
                {r.winnerName} ({r.winnerRate}) vs {r.loserName} ({r.loserRate})
              </div>
              <div className="text-sm text-gray-500">
                試合日時: {r.playedAtFormatted}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}