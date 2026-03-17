'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect, { PlayerOption } from '@/components/PlayerSelect';
import Input from '@/components/Input';

type Props = {
  players: Player[];
  results: Result[];  // ★ これを追加
};

export default function ResultsClient({ players }: Props) {
  const [mounted, setMounted] = useState(false);

  const [mode, setMode] = useState<'date' | 'search'>('date');
  const [date, setDate] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [playedAt, setPlayedAt] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchResults();
  }, []);

  if (!mounted) return null;

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* --------------------------------------------------------------------
   * GET /api/result
   * -------------------------------------------------------------------- */
  async function fetchResults(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`/api/result${query}`);
    const data = await res.json();

    setMode(data.mode);
    setResults(data.results);
    setDate(data.date ?? null);
    setPrevDate(data.prevDate ?? null);
    setNextDate(data.nextDate ?? null);
  }

  /* --------------------------------------------------------------------
   * 登録
   * -------------------------------------------------------------------- */
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

    const w = players.find((p) => p.id === winnerOpt.value)!;
    const l = players.find((p) => p.id === loserOpt.value)!;

    await fetch('/api/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winnerId: w.id,
        winnerName: w.name,
        winnerRate: w.currentRate,
        loserId: l.id,
        loserName: l.name,
        loserRate: l.currentRate,
        playedAt: new Date(playedAt).toISOString(),
      }),
    });

    // レート計算API呼び出し
    await fetch('/api/calculate', { method: 'POST' });

    alert('登録が完了しました');
    fetchResults();
  };

  /* --------------------------------------------------------------------
   * 削除
   * -------------------------------------------------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm('この対局結果を削除しますか？')) return;

    await fetch(`/api/result?id=${id}`, { method: 'DELETE' });

    // レート計算API呼び出し
    await fetch('/api/calculate', { method: 'POST' });

    alert('削除が完了しました');
    if (date) fetchResults({ date });
    else fetchResults();
  };

  /* --------------------------------------------------------------------
   * 検索
   * -------------------------------------------------------------------- */
  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (winnerOpt) params.winner = winnerOpt.label;
    if (loserOpt) params.loser = loserOpt.label;
    fetchResults(params);
  };

  /* --------------------------------------------------------------------
   * 日付ページネーション
   * -------------------------------------------------------------------- */
  const handleNextDate = () => {
    if (nextDate) fetchResults({ date: nextDate });
  };

  const handlePrevDate = () => {
    if (prevDate) fetchResults({ date: prevDate });
  };

  /* --------------------------------------------------------------------
   * UI
   * -------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>対局結果管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* Form */}
      <div className={styles.formCard}>
        <form className={styles.formBar} onSubmit={handleRegister}>
          <div style={{ minWidth: 250 }}>
            <PlayerSelect
              value={winnerOpt}
              onChange={setWinnerOpt}
              options={playerOptions}
              placeholder="勝者を選択"
              mode="select"   // ★ 新規入力を許可しない
            />
          </div>
          <div style={{ minWidth: 250 }}>
            <PlayerSelect
              value={loserOpt}
              onChange={setLoserOpt}
              options={playerOptions}
              placeholder="敗者を選択"
              mode="select"   // ★ 新規入力を許可しない
            />
          </div>

          <Input
            type="datetime-local"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            width={240}
          />

          <button
            type="button"
            onClick={handleSearch}
            className={styles.searchButton}
          >
            検索
          </button>

          <button type="submit" className={styles.registerButton}>
            登録
          </button>
        </form>
      </div>

      {/* Pagination */}
      {mode === 'date' && (
        <div className={styles.paginationBar}>
          <button
            type="button"
            onClick={handleNextDate}
            disabled={!nextDate}
            className={styles.pageButton}
          >
            次の日
          </button>

          <span className={styles.pageDate}>{date ?? 'データなし'}</span>

          <button
            type="button"
            onClick={handlePrevDate}
            disabled={!prevDate}
            className={styles.pageButton}
          >
            前の日
          </button>
        </div>
      )}

      {/* Table */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataTable
            tableClass={styles.table}
            rows={results}
            columns={[
              {
                header: '日時',
                render: (r) =>
                  new Date(r.playedAt).toLocaleString('ja-JP'),
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