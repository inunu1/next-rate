'use client';

import styles from './Admin.module.css';
import { useState } from 'react';
import { AdminUser } from '@/types/admin';

type Props = {
  users: AdminUser[];
};

export default function AdminClient({ users }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [adminList, setAdminList] = useState(users);

  const handleRegister = async () => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`登録失敗: ${error.error}`);
        return;
      }

      const newUser: AdminUser = await res.json();
      alert(`登録成功: ${newUser.email}`);

      // 入力クリア
      setEmail('');
      setName('');
      setPassword('');

      // 一覧に追加
      setAdminList((prev) => [newUser, ...prev]);
    } catch (err) {
      alert('通信エラーが発生しました');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <header className={styles.menuBar}>
        <h1 className={styles.title}>管理者管理</h1>
        <button className={styles.registerButton} onClick={handleRegister}>
          管理者登録
        </button>
      </header>

      {/* フォームバー */}
      <section className={styles.formBar}>
        <input
          className={styles.input}
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="text"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </section>

      {/* メインコンテンツ */}
      <main className={styles.main}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {adminList.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name ?? '未設定'}</td>
                <td>
                  <button className={styles.actionButton}>編集</button>
                  <button className={styles.actionButton}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}