'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Admin.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect from '@/components/PlayerSelect';

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

// /api/private/common 用の型
type ApiBody = {
  action: 'create' | 'update' | 'delete' | 'list' | 'get';
  table: 'User';
  id?: string;
  data?: Record<string, unknown>;
  select?: Record<string, boolean>;
};

export default function AdminClient({ users, currentUserId }: Props) {
  const [selected, setSelected] = useState<AdminOption | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  const adminOptions: AdminOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? '(名前なし)',
  }));


  // 共通 API 呼び出し
  async function callApi(body: ApiBody) {
    const res = await fetch('/api/private/common', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // 新規登録
  const handleRegister = async () => {
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

    await callApi({
      action: 'create',
      table: 'User',
      data: {
        name: selected.label,
        email,
        password, // ハッシュ化は API 側で行う
      },
    });

    location.reload();
  };

  // 名前検索
  const handleSearch = () => {
    if (!selected || selected.__isNew__) {
      setFilteredUsers(users);
      return;
    }
    setFilteredUsers(users.filter((u) => u.id === selected.value));
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('この管理者を削除しますか？')) return;
    await callApi({
      action: 'delete',
      table: 'User',
      id,
    });

    location.reload();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>管理者管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      <div className={styles.formCard}>
        <div className={styles.formBar}>
          <div className={styles.selectWrapper}>
            <PlayerSelect
              options={adminOptions}
              value={selected}
              onChange={setSelected}
              placeholder="名前検索 / 新規入力"
              width="260px"
            />
          </div>

          <input
            type="email"
            placeholder="メールアドレス（新規登録時）"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />

          <input
            type="password"
            placeholder="パスワード（新規登録時）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />

          <button
            type="button"
            onClick={handleSearch}
            className={styles.searchButton}
          >
            検索
          </button>

          <button
            type="button"
            onClick={handleRegister}
            className={styles.registerButton}
          >
            新規登録
          </button>
        </div>
      </div>

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