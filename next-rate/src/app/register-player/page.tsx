// ファイル: src/app/register-player/page.tsx
'use client';

import { useState } from 'react';

export default function RegisterPlayerPage() {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [rating, setRating] = useState('');

  const handleSubmit = () => {
    alert(`姓: ${lastName}, 名: ${firstName}, レート: ${rating}`);
    window.close(); // 登録後にポップアップを閉じる
  };

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">プレイヤー登録</h1>

      <div className="mb-3">
        <label className="block">姓（Last Name）</label>
        <input
          type="text"
          className="border rounded w-full px-2 py-1"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block">名（First Name）</label>
        <input
          type="text"
          className="border rounded w-full px-2 py-1"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block">レート</label>
        <input
          type="number"
          className="border rounded w-full px-2 py-1"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        登録
      </button>
    </main>
  );
}
