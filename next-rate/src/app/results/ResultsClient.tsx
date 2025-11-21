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
      {/* タイトルバー */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">対局結果管理</h1>
        <form action="/dashboard" method="get">
          <button type="submit" className="border px-4 py-1 rounded">
            Dashboardへ
          </button>
        </form>
      </div>

      {/* 登録フォームバー */}
      <form
        action="/results/register"
        method="post"
        className="flex gap-4 items-center border p-4 rounded"
      >
        <label>
          勝者:
          <select name="winnerId" required className="ml-2 border rounded px-2 py-1">
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
          <select name="loserId" required className="ml-2 border rounded px-2 py-1">
            <option value="">選択してください</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="border px-4 py-1 rounded bg-gray-100">
          登録
        </button>
      </form>

      {/* 一覧テーブル */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">日時</th>
            <th className="p-2">勝者</th>
            <th className="p-2">敗者</th>
            <th className="p-2">操作</th>
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
                <form action="/results/delete" method="post">
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-red-600 hover:underline">
                    削除
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}