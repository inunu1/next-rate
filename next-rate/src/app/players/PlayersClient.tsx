'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Players.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect from '@/components/PlayerSelect';
import Input from '@/components/Input';

type Player = {
  id: string;
  name: string;
  initialRate: number;
  currentRate: number;
};

type Props = {
  players: Player[];
  currentUserId: string;
};

type PlayerOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export default function PlayersClient({ players, currentUserId }: Props) {
  /* ------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------ */
  const [selected, setSelected] = useState<PlayerOption | null>(null);
  const [initialRate, setInitialRate] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState(players);

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* ------------------------------------------------------------
   * REST API 呼び出し（共通化）
   * ------------------------------------------------------------ */

  // 新規登録（POST）
  async function postPlayer(data: { name: string; initialRate: number }) {
    const res = await fetch('/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // 論理削除（DELETE）
  async function deletePlayer(id: string) {
    const res = await fetch('/api/player', {
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
      alert('新規プレイヤー名を入力してください');
      return;
    }
    if (!initialRate) {
      alert('初期レートを入力してください');
      return;
    }

    await postPlayer({
      name: selected.label,
      initialRate: Number(initialRate),
    });

    location.reload();
  };

  /* ------------------------------------------------------------
   * 検索（クライアント側フィルタ）
   * ------------------------------------------------------------ */
  const handleSearch = () => {
    if (!selected || selected.__isNew__) {
      setFilteredPlayers(players);
      return;
    }
    setFilteredPlayers(players.filter((p) => p.id === selected.value));
  };

  /* ------------------------------------------------------------
   * 出禁（論理削除）
   * ------------------------------------------------------------ */
  const handleSoftDelete = async (id: string) => {
    if (!confirm('このプレイヤーを出禁にしますか？')) return;

    await deletePlayer(id);

    location.reload();
  };

  /* ------------------------------------------------------------
   * 画面描画
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
        <div className={styles.formBar}>
          <div className={styles.selectWrapper}>
            <PlayerSelect
              options={playerOptions}
              value={selected}
              onChange={setSelected}
              placeholder="プレイヤー検索 / 新規入力"
              width="260px"
              mode="creatable" // ★ 新規入力を許可
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