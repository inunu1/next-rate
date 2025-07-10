// src/app/register/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      router.push('/login'); // 成功したらログイン画面へ
    } else {
      alert('登録に失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold">新規登録</h1>
      <input type="text" placeholder="名前" value={name} onChange={e => setName(e.target.value)} required />
      <input type="email" placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">登録</button>
    </form>
  );
}
