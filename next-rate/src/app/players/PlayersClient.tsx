'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Players.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect from '@/components/PlayerSelect';
import Input from '@/components/Input';

/**
 * ============================================================
 * 【画面概要】
 * プレイヤー管理（Client Component）
 *
 * 【責務】
 * ・初期表示でプレイヤー一覧を API から取得
 * ・検索条件の管理
 * ・プレイヤーの新規登録／論理削除
 *
 * 【非責務】
 * ・DB アクセス（API に集約）
 * ・認証（page.tsx 側で実施）
 * ============================================================
 */

type Player = {
  id: string;
  name: string;
  initialRate: number;
  currentRate: number;
};

type PlayerOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export default function PlayersClient({ currentUserId }: { currentUserId: string }) {
  /* ------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------ */
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);

  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');
  const [searchOpt, setSearchOpt] = useState<PlayerOption | null>(null);
  const [registerOpt, setRegisterOpt] = useState<PlayerOption | null>(null);
  const [initialRate, setInitialRate] = useState('');

  /* ------------------------------------------------------------
   * 初期表示：プレイヤー一覧を取得
   * ------------------------------------------------------------ */
  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const res = await fetch('/api/private/player');
    const data = await res.json();
    setPlayers(data);
    setFilteredPlayers(data);
  }

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* ------------------------------------------------------------
   * REST API 呼び出し
   * ------------------------------------------------------------ */

  // 新規登録（POST）
  async function postPlayer(data: { name: string; initialRate: number }) {
    const res = await fetch('/api/private/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // 論理削除（DELETE）
  async function deletePlayer(id: string) {
    const res = await fetch('/api/private/player', {
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
      alert('新規プレイヤー名を入力してください');
      return;
    }
    if (!initialRate) {
      alert('初期レートを入力してください');
      return;
    }

    await postPlayer({
      name: registerOpt.label,
      initialRate: Number(initialRate),
    });

    alert('登録が完了しました');
    fetchPlayers();
  };

  /* ------------------------------------------------------------
   * 検索処理（クライアント側フィルタ）
   * ------------------------------------------------------------ */
  const handleSearch = () => {
    if (!searchOpt || searchOpt.__isNew__) {
      setFilteredPlayers(players);
      return;
    }
    setFilteredPlayers(players.filter((p) => p.id === searchOpt.value));
  };

  /* ------------------------------------------------------------
   * 出禁（論理削除）
   * ------------------------------------------------------------ */
  const handleSoftDelete = async (id: string) => {
    if (!confirm('このプレイヤーを出禁にしますか？')) return;

    await deletePlayer(id);

    alert('削除が完了しました');
    fetchPlayers();
  };

  /* ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------ */
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>対局者管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* Form Area */}
      <div className={styles.formCard}>
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
          <div className={styles.formBar}>
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={playerOptions}
                value={searchOpt}
                onChange={setSearchOpt}
                placeholder="プレイヤーで絞り込み"
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
                setFilteredPlayers(players);
              }}
              className={styles.searchButton}
            >
              クリア
            </button>
          </div>
        ) : (
          <form
            className={styles.formBar}
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={playerOptions}
                value={registerOpt}
                onChange={setRegisterOpt}
                placeholder="新規プレイヤー名を入力"
                width="260px"
                mode="creatable"
              />
            </div>

            <Input
              type="number"
              placeholder="初期レート (例: 1500)"
              value={initialRate}
              onChange={(e) => setInitialRate(e.target.value)}
              min={1000}
              max={9999}
              width={200}
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
            rows={filteredPlayers}
            columns={[
              { header: 'プレイヤー名', render: (p) => p.name },
              { header: '現在レート', render: (p) => p.currentRate },
              { header: '初期レート', render: (p) => p.initialRate },
              {
                header: '操作',
                render: (p) =>
                  p.id !== currentUserId && (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleSoftDelete(p.id)}
                    >
                      出禁
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