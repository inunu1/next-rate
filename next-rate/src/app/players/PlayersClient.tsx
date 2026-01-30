'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Players.module.css';
import DataTable from '@/components/DataTable';
import CreatableSelect from 'react-select/creatable';
import { StylesConfig } from 'react-select';

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

// API に送る型
type ApiBody = {
  action: 'create' | 'update' | 'delete' | 'list' | 'get';
  table: 'player';
  id?: string;
  data?: Record<string, unknown>;
  select?: Record<string, boolean>;
};

export default function PlayersClient({ players, currentUserId }: Props) {
  const [selected, setSelected] = useState<PlayerOption | null>(null);
  const [initialRate, setInitialRate] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState(players);

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const customSelectStyles: StylesConfig<PlayerOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: 42,
      height: 42,
      borderRadius: 6,
      borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
      boxShadow: state.isFocused ? '0 0 0 3px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)' : 'none',
      backgroundColor: 'var(--color-bg-surface)',
      '&:hover': {
        borderColor: 'var(--color-text-muted)',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      height: 42,
      padding: '0 8px',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--color-text-main)',
    }),
    input: (base) => ({
      ...base,
      color: 'var(--color-text-main)',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 6,
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-md)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      color: 'var(--color-text-main)',
      backgroundColor: state.isFocused ? 'var(--color-bg-app)' : 'var(--color-bg-surface)',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--color-primary)',
        color: 'white',
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--color-text-muted)',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  // ---------------------------------------------------------
  // 共通 API 呼び出し
  // ---------------------------------------------------------
  async function callApi(body: ApiBody) {
    const res = await fetch('/api/private/common', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // ---------------------------------------------------------
  // 新規登録（create）
  // ---------------------------------------------------------
  const handleRegister = async () => {
    if (!selected || !selected.__isNew__) {
      alert('新規プレイヤー名を入力してください');
      return;
    }
    if (!initialRate) {
      alert('初期レートを入力してください');
      return;
    }

    await callApi({
      action: 'create',
      table: 'player',
      data: {
        name: selected.label,
        initialRate: Number(initialRate),
        currentRate: Number(initialRate),
      },
    });

    location.reload();
  };

  // ---------------------------------------------------------
  // 検索（クライアント側フィルタ）
  // ---------------------------------------------------------
  const handleSearch = () => {
    if (!selected || selected.__isNew__) {
      setFilteredPlayers(players);
      return;
    }
    setFilteredPlayers(players.filter((p) => p.id === selected.value));
  };

  // ---------------------------------------------------------
  // 出禁（論理削除 → update）
  // ---------------------------------------------------------
  const handleSoftDelete = async (id: string) => {
    if (!confirm('このプレイヤーを出禁にしますか？')) return;
    
    await callApi({
      action: 'update',
      table: 'player',
      id,
      data: { deletedAt: new Date().toISOString() },
    });

    location.reload();
  };

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
            <CreatableSelect
              options={playerOptions}
              value={selected}
              onChange={(opt) => setSelected(opt)}
              placeholder="プレイヤー検索 / 新規入力"
              styles={customSelectStyles}
              isClearable
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            />
          </div>

          <input
            type="number"
            placeholder="初期レート (例: 1500)"
            value={initialRate}
            onChange={(e) => setInitialRate(e.target.value)}
            min={1000}
            max={9999}
            className={styles.input}
          />

          <button
            type="button"
            onClick={handleRegister}
            className={styles.registerButton}
          >
            新規登録
          </button>

          <button
            type="button"
            onClick={handleSearch}
            className={styles.searchButton}
          >
            検索
          </button>
        </div>
      </div>

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