'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Admin.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect from '@/components/PlayerSelect';
import Input from '@/components/Input';

/**
 * ============================================================
 * 【画面概要】
 * 管理ユーザー管理（Client Component）
 *
 * 【責務】
 * ・初期表示で管理ユーザー一覧を API から取得
 * ・検索条件の管理（クライアント側フィルタ）
 * ・管理ユーザーの新規登録（POST）
 * ・管理ユーザーの削除（DELETE）
 *
 * 【非責務】
 * ・認証（page.tsx 側で実施）
 * ・DB アクセス（API に集約）
 * ・業務ロジック（API Route に集約）
 *
 * 【設計方針】
 * ・UI はイベントと状態管理に専念し、データ操作は API に委譲する
 * ・Players / Results と同一アーキテクチャで統一し、保守性を高める
 * ・検索はクライアント側フィルタで軽量に実装
 * ============================================================
 */
type AdminOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
};

export default function AdminClient({ currentUserId }: { currentUserId: string }) {
  /* ------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------ */
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);

  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');
  const [searchOpt, setSearchOpt] = useState<AdminOption | null>(null);
  const [registerOpt, setRegisterOpt] = useState<AdminOption | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /* ------------------------------------------------------------
   * 初期表示：管理ユーザー一覧を API から取得
   * ------------------------------------------------------------ */
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const res = await fetch('/api/private/admin');
    const data = await res.json();
    setUsers(data);
    setFilteredUsers(data);
  }

  // ▼ セレクトボックス用オプション
  const adminOptions = users.map((u) => ({
    value: u.id,
    label: u.name ?? '(名前なし)',
  }));

  /* ------------------------------------------------------------
   * REST API 呼び出し
   * ------------------------------------------------------------ */
  async function postAdmin(data: { name: string; email: string; password: string }) {
    const res = await fetch('/api/private/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async function deleteAdmin(id: string) {
    const res = await fetch('/api/private/admin', {
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
    if (!registerOpt || !registerOpt.__isNew__) {
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
      name: registerOpt.label,
      email,
      password,
    });

    alert('登録が完了しました');
    fetchUsers();
  };

  /* ------------------------------------------------------------
   * 名前検索（クライアント側フィルタ）
   * ------------------------------------------------------------ */
  const handleSearch = () => {
    if (!searchOpt || searchOpt.__isNew__) {
      setFilteredUsers(users);
      return;
    }
    setFilteredUsers(users.filter((u) => u.id === searchOpt.value));
  };

  /* ------------------------------------------------------------
   * 削除処理（物理削除）
   * ------------------------------------------------------------ */
  const handleDelete = async (id: string) => {
    if (!confirm('この管理者を削除しますか？')) return;

    await deleteAdmin(id);

    alert('削除が完了しました');
    fetchUsers();
  };

  /* ------------------------------------------------------------
   * UI
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
        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'search' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 検索
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'register' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('register')}
          >
            ✍️ 新規登録
          </button>
        </div>

        {activeTab === 'search' ? (
          /* ---------- 検索タブ UI ---------- */
          <div className={styles.formBar}>
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={adminOptions}
                value={searchOpt}
                onChange={setSearchOpt}
                placeholder="管理者で絞り込み"
                width="260px"
                mode="select"
              />
            </div>

            <button type="button" onClick={handleSearch} className={styles.searchButton}>
              検索
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpt(null);
                setFilteredUsers(users);
              }}
              className={styles.searchButton}
            >
              クリア
            </button>
          </div>
        ) : (
          /* ---------- 登録タブ UI ---------- */
          <form
            className={styles.formBar}
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={adminOptions}
                value={registerOpt}
                onChange={setRegisterOpt}
                placeholder="新規管理者の名前を入力"
                width="260px"
                mode="creatable"
              />
            </div>

            <Input
              type="email"
              placeholder="メールアドレス（新規登録時）"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              width={260}
            />

            <Input
              type="password"
              placeholder="パスワード（新規登録時）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              width={260}
            />

            <button type="submit" className={styles.registerButton}>
              新規登録
            </button>
          </form>
        )}
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