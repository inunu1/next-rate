// ファイル: src/app/index-player/page.tsx

'use client';

import { useState } from 'react';

interface Player {
  id: number;
  name: string;
  rating: number;
}

export default function IndexPlayerPage() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: '湯上真司', rating: 1500 },
    { id: 2, name: '平野和宏', rating: 1600 },
    { id: 3, name: '箭子涼太', rating: 1450 },
    // 必要に応じてダミーデータ追加
  ]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">プレイヤー一覧</h1>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">名前</th>
            <th className="border px-4 py-2">レート</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td className="border px-4 py-2">{player.id}</td>
              <td className="border px-4 py-2">{player.name}</td>
              <td className="border px-4 py-2">{player.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
