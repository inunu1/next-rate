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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">対局管理</h1>
        {/* 今後ここに新規登録ボタンを追加可能 */}
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">日時</th>
            <th className="p-2">勝者</th>
            <th className="p-2">敗者</th>
            <th className="p-2">アクション</th>
          </tr>
        </thead>
        <tbody>
          {formattedResults.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.playedAtFormatted}</td>
              <td className="p-2">
                {r.winnerName}（{r.winnerRate}）
              </td>
              <td className="p-2">
                {r.loserName}（{r.loserRate}）
              </td>
              <td className="p-2">
                <button className="text-red-600 hover:underline">削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}