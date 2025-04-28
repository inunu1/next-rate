'use client';

import { useState } from 'react';

interface Player {
  id: number;
  lastName: string;
  firstName: string;
  rating: number;
}

export default function IndexPlayerPage() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, lastName: '緒方', firstName: '健太', rating: 1500 },
    { id: 2, lastName: '白井', firstName: '大輔', rating: 1600 },
    { id: 3, lastName: '中深', firstName: '優', rating: 1450 },
  ]);

  const openRegisterWindow = () => {
    // ポップアップウィンドウを開く
    window.open(
      '/register-player',
      'registerWindow',
      'width=400,height=400,resizable=no'
    );
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">プレイヤー一覧</h1>

      <button
        onClick={openRegisterWindow}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        新規プレイヤー追加（ポップアップ）
      </button>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">姓</th>
            <th className="border px-4 py-2">名</th>
            <th className="border px-4 py-2">レート</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td className="border px-4 py-2">{player.id}</td>
              <td className="border px-4 py-2">{player.lastName}</td>
              <td className="border px-4 py-2">{player.firstName}</td>
              <td className="border px-4 py-2">{player.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
