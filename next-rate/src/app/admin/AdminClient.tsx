'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Admin.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect from '@/components/PlayerSelect';
import Input from '@/components/Input';

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  users: AdminUser[];
  currentUserId: string;
};

type AdminOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export default function AdminClient({ users, currentUserId }: Props) {
  /* ------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------ */
  const [selected, setSelected] = useState<AdminOption | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  // セレクトボックス用オプション
  const adminOptions: AdminOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? '(名前なし)',
  }));

  /* ------------------------------------------------------------
   * REST API 呼び出し（共通化）
   * ------------------------------------------------------------ */
  async function postAdmin(data: { name: string; email: string; password: string }) {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async function deleteAdmin(id: string) {
    const res = await fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return res.json();
  }

  /* ------------------------------------------------------------
   * 新規登録処理
   * ------------------------------------------------------------ */
  const handleRegister = async () => {
    // ▼ 入力チェック（SIer では必須）
    if (!selected || !selected.__isNew__) {
      alert('新規管理者の名前を入力してください');
      return;
    }
    if (!email) {
      alert('メールアドレスを入力してください');
      return;
    }
    if (!password) {
      alert('パスワードを入力してください');
      return;
    }

    await postAdmin({
      name: selected.label,
      email,
      password,
    });

    location.reload();
  };

  /* ------------------------------------------------------------
   * 名前検索（クライアント側フィルタ）
   * ------------------------------------------------------------ */
  const handleSearch = () => {
    if (!selected || selected.__isNew__) {
      setFilteredUsers(users);
      return;
    }
    setFilteredUsers(users.filter((u) => u.id === selected.value));
  };

  /* ------------------------------------------------------------
   * 削除処理（物理削除）
   * ------------------------------------------------------------ */
  const handleDelete = async (id: string) => {
    if (!confirm('この管理者を削除しますか？')) return;

    await deleteAdmin(id);

    location.reload();
  };

  /* ------------------------------------------------------------
   * 画面描画
   * ------------------------------------------------------------ */
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>管理者管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* 入力フォーム */}
      <div className={styles.formCard}>
        <div className={styles.formBar}>
          <div className={styles.selectWrapper}>
            <PlayerSelect
              options={adminOptions}
              value={selected}
              onChange={setSelected}
              placeholder="名前検索 / 新規入力"
              width="260px"
              mode="creatable" // ★ 新規入力を許可
            />
          </div>

          <Input
            type="email"
            placeholder="メールアドレス（新規登録時）"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            width={225}
          />

          <Input
            type="password"
            placeholder="パスワード（新規登録時）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            width={220}
          />

          <button type="button" onClick={handleSearch} className={styles.searchButton}>
            検索
          </button>

          <button type="button" onClick={handleRegister} className={styles.registerButton}>
            新規登録
          </button>
        </div>
      </div>

      {/* 一覧表示 */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataTable
            tableClass={styles.table}
            rows={filteredUsers}
            columns={[
              { header: 'Email', render: (u) => u.email },
              { header: 'Name', render: (u) => u.name ?? '未設定' },
              {
                header: '操作',
                render: (u) =>
                  u.id !== currentUserId && (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDelete(u.id)}
                    >
                      削除
                    </button>
                  ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
}