'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Player } from '@prisma/client';
import styles from './Player.module.css';
import Input from '@/components/Input';

/**
 * ============================================================
 * 【機能概要】
 * プレイヤー管理画面（Client Component）。
 * 以下の機能を提供する。
 *
 * ① 初期表示：全プレイヤー一覧を取得
 * ② 検索：keyword による部分一致検索
 * ③ 登録：name / initialRate による新規登録
 * ④ 削除：論理削除（deletedAt 設定）
 *
 * 【データ取得方針】
 * ・全件取得 / 検索ともに API 経由で行う
 * ・Server Component から props は受け取らない
 *
 * 【例外処理方針】
 * ・業務エラーは alert 表示
 * ・システムエラーは簡易メッセージ表示
 * ============================================================
 */

export default function PlayerClient() {
  /* ------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------ */
  const [players, setPlayers] = useState<Player[]>([]);
  const [keyword, setKeyword] = useState('');
  const [name, setName] = useState('');
  const [initialRate, setInitialRate] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');

  /* ------------------------------------------------------------
   * 初期表示：全件取得
   * ------------------------------------------------------------ */
  useEffect(() => {
    fetchPlayers();
  }, []);

  /* ------------------------------------------------------------
   * GET /api/private/player（全件 or 検索）
   * ------------------------------------------------------------ */
  async function fetchPlayers() {
    const query = keyword ? `?keyword=${keyword}` : '';
    const res = await fetch(`/api/private/player${query}`);
    const data = await res.json();
    setPlayers(data);
  }

  /* ------------------------------------------------------------
   * POST /api/private/player（新規登録）
   * ------------------------------------------------------------ */
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name || !initialRate) {
      alert('名前と初期レートは必須です');
      return;
    }

    const res = await fetch('/api/private/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        initialRate: Number(initialRate),
      }),
    });

    if (!res.ok) {
      alert('登録に失敗しました');
      return;
    }

    alert('登録が完了しました');
    setName('');
    setInitialRate('');
    fetchPlayers();
  }

  /* ------------------------------------------------------------
   * DELETE /api/private/player（論理削除）
   * ------------------------------------------------------------ */
  async function handleDelete(id: string) {
    if (!confirm('このプレイヤーを削除しますか？')) return;

    const res = await fetch('/api/private/player', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      alert('削除に失敗しました');
      return;
    }

    alert('削除が完了しました');
    fetchPlayers();
  }

  /* ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------ */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>プレイヤー管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* タブ切り替え */}
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

      {/* 検索タブ */}
      {activeTab === 'search' && (
        <div className={styles.formBar}>
          <Input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="名前で検索"
            width={200}
          />
          <button type="button" onClick={fetchPlayers} className={styles.searchButton}>
            検索
          </button>
        </div>
      )}

      {/* 登録タブ */}
      {activeTab === 'register' && (
        <form className={styles.formBar} onSubmit={handleRegister}>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前"
            width={200}
          />
          <Input
            type="number"
            value={initialRate}
            onChange={(e) => setInitialRate(e.target.value)}
            placeholder="初期レート"
            width={120}
          />
          <button type="submit" className={styles.registerButton}>
            登録
          </button>
        </form>
      )}

      {/* 一覧表示 */}
      <main className={styles.main}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>名前</th>
              <th>レート</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.currentRate}</td>
                <td>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(p.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}