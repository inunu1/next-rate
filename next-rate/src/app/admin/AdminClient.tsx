'use client';

import styles from './Admin.module.css';
import { useState } from 'react';

export default function AdminClient() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    console.log('登録処理:', { email, name, password });
    // TODO: API呼び出しで登録処理を実装
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
            {/* TODO: 管理者一覧をマッピング表示 */}
            <tr>
              <td>admin@example.com</td>
              <td>管理者A</td>
              <td>
                <button className={styles.actionButton}>編集</button>
                <button className={styles.actionButton}>削除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}