'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import DataTable from '@/components/DataTable';
import Select, { StylesConfig } from 'react-select';

type Props = {
  players: Player[];
  results: Result[];
};

type PlayerOption = {
  value: string;
  label: string;
};

// /api/private/common 用の型
type ApiBody = {
  action: 'create' | 'delete';
  table: 'Result';
  id?: string;
  data?: Record<string, unknown>;
};

export default function ResultsClient({ players, results }: Props) {
  const [mounted, setMounted] = useState(false);
  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [playedAt, setPlayedAt] = useState('');
  const [filteredResults, setFilteredResults] = useState(results);

  // Hydration Error回避のため、マウント後に描画
  useEffect(() => {
     setMounted(true);
  }, []);

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // ... (options definition) ...

  if (!mounted) return null; // Prevent SSR mismatch

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
    singleValue: (base) => ({ ...base, color: 'var(--color-text-main)' }),
    input: (base) => ({ ...base, color: 'var(--color-text-main)' }),
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
    placeholder: (base) => ({ ...base, color: 'var(--color-text-muted)' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  // 共通 API 呼び出し
  async function callApi(body: ApiBody) {
    const res = await fetch('/api/private/common', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // レーティング計算
  const handleRecalculate = async () => {
    const res = await fetch('/api/private/calculate', { method: 'POST' });
    if (res.ok) {
      alert('レーティング計算が完了しました');
      location.reload();
    } else {
      const data = await res.json();
      alert(`エラー: ${data.error ?? '計算に失敗しました'}`);
    }
  };

  // 登録処理
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!winnerOpt || !loserOpt || !playedAt) {
      alert('勝者・敗者・対局日時は必須です');
      return;
    }
    if (winnerOpt.value === loserOpt.value) {
      alert('勝者と敗者は別のプレイヤーを選んでください');
      return;
    }

    const winner = players.find((p) => p.id === winnerOpt.value)!;
    const loser = players.find((p) => p.id === loserOpt.value)!;

    await callApi({
      action: 'create',
      table: 'Result',
      data: {
        winnerId: winner.id,
        winnerName: winner.name,
        winnerRate: winner.currentRate,
        loserId: loser.id,
        loserName: loser.name,
        loserRate: loser.currentRate,
        playedAt: new Date(playedAt).toISOString(),
      },
    });

    await handleRecalculate();
  };

  // 検索処理
  const handleSearch = () => {
    let next = results;
    if (winnerOpt) next = next.filter((r) => r.winnerId === winnerOpt.value);
    if (loserOpt) next = next.filter((r) => r.loserId === loserOpt.value);
    setFilteredResults(next);
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    if (!confirm('この対局結果を削除しますか？')) return;
    await callApi({
      action: 'delete',
      table: 'Result',
      id,
    });

    await handleRecalculate();
  };

  // ★ アーカイブ処理（POST）
  const handleArchive = async () => {
    const res = await fetch('/api/private/archive', { method: 'POST' });

    if (res.ok) {
      alert('アーカイブが完了しました');
      window.location.href = '/results'; // リダイレクト
    } else {
      const data = await res.json();
      alert(`エラー: ${data.error ?? 'アーカイブに失敗しました'}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>対局結果管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* Form Area */}
      <div className={styles.formCard}>
        <form className={styles.formBar} onSubmit={handleRegister}>
          <div className={styles.selectWrapper}>
            <Select
              options={playerOptions}
              value={winnerOpt}
              onChange={setWinnerOpt}
              placeholder="勝者を選択"
              styles={customSelectStyles}
              isClearable
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            />
          </div>

          <div className={styles.selectWrapper}>
            <Select
              options={playerOptions}
              value={loserOpt}
              onChange={setLoserOpt}
              placeholder="敗者を選択"
              styles={customSelectStyles}
              isClearable
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            />
          </div>

          <input
            type="datetime-local"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            className={styles.input}
          />

          <button type="submit" className={styles.registerButton}>
            登録
          </button>

          <button
            type="button"
            onClick={handleSearch}
            className={styles.searchButton}
          >
            検索
          </button>

          {/* ★ アーカイブボタン追加 ★ */}
          <button
            type="button"
            onClick={handleArchive}
            className={styles.searchButton}
          >
            アーカイブ
          </button>
        </form>
      </div>

      {/* ★ 横スクロール対応 wrapper */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataTable
            tableClass={styles.table}
            rows={filteredResults}
            columns={[
              {
                header: '日時',
                render: (r) => new Date(r.playedAt).toLocaleString('ja-JP'),
              },
              {
                header: '勝者（開始時）',
                render: (r) => `${r.winnerName}（${r.winnerRate}）`,
              },
              {
                header: '敗者（開始時）',
                render: (r) => `${r.loserName}（${r.loserRate}）`,
              },
              {
                header: '操作',
                render: (r) => (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(r.id)}
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