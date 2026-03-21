'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect, { PlayerOption } from '@/components/PlayerSelect';
import Input from '@/components/Input';

/**
 * ============================================================
 * 【画面概要】
 * 対局結果管理（Client Component）
 *
 * 【責務】
 * ・初期表示でプレイヤー一覧と対局結果を API から取得
 * ・検索条件の管理
 * ・対局結果の登録／削除
 *
 * 【非責務】
 * ・DB アクセス（API に集約）
 * ・認証（page.tsx 側で実施）
 * ============================================================
 */

export default function ResultsClient() {
  /* ------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------ */
  const [mounted, setMounted] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const [mode, setMode] = useState<'date' | 'search'>('date');
  const [date, setDate] = useState<string | null>(null);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [playedAt, setPlayedAt] = useState('');

  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  /* ------------------------------------------------------------
   * 初期表示：プレイヤー一覧 & 対局結果を取得
   * ------------------------------------------------------------ */
  useEffect(() => {
    setMounted(true);
    fetchPlayers();
    fetchResults();
  }, []);

  if (!mounted) return null;

  /* ------------------------------------------------------------
   * プレイヤー一覧取得（全件）
   * ------------------------------------------------------------ */
  async function fetchPlayers() {
    const res = await fetch('/api/private/player');
    const data = await res.json();
    setPlayers(data);
  }

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* ------------------------------------------------------------
   * 対局結果取得
   * ------------------------------------------------------------ */
  async function fetchResults(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`/api/private/result${query}`);
    const data = await res.json();

    setMode(data.mode);
    setResults(data.results);
    setDate(data.date ?? null);
    setPrevDate(data.prevDate ?? null);
    setNextDate(data.nextDate ?? null);
  }

  /* ------------------------------------------------------------
   * 登録処理
   * ------------------------------------------------------------ */
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

    await fetch('/api/private/result', {
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

    await fetch('/api/private/calculate', { method: 'POST' });

    alert('登録が完了しました');
    fetchResults();
  };

  /* ------------------------------------------------------------
   * 削除処理
   * ------------------------------------------------------------ */
  const handleDelete = async (id: string) => {
    if (!confirm('この対局結果を削除しますか？')) return;

    await fetch(`/api/private/result?id=${id}`, { method: 'DELETE' });
    await fetch('/api/private/calculate', { method: 'POST' });

    alert('削除が完了しました');
    date ? fetchResults({ date }) : fetchResults();
  };

  /* ------------------------------------------------------------
   * 検索処理
   * ------------------------------------------------------------ */
  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (winnerOpt) params.winner = winnerOpt.label;
    if (loserOpt) params.loser = loserOpt.label;
    if (searchFrom) params.from = searchFrom;
    if (searchTo) params.to = searchTo;
    fetchResults(params);
  };

  /* ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------ */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>対局結果管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* ---------- フォームエリア ---------- */}
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
            <div style={{ minWidth: 250 }}>
              <PlayerSelect
                value={winnerOpt}
                onChange={setWinnerOpt}
                options={playerOptions}
                placeholder="勝者で絞り込み"
                mode="select"
              />
            </div>

            <div style={{ minWidth: 250 }}>
              <PlayerSelect
                value={loserOpt}
                onChange={setLoserOpt}
                options={playerOptions}
                placeholder="敗者で絞り込み"
                mode="select"
              />
            </div>

            <div className={styles.dateRange}>
              <Input
                type="date"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                width={140}
              />
              <span className={styles.dateRangeSeparator}>〜</span>
              <Input
                type="date"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                width={140}
              />
            </div>

            <button type="button" onClick={handleSearch} className={styles.searchButton}>
              検索
            </button>
          </div>
        ) : (
          <form className={styles.formBar} onSubmit={handleRegister}>
            <div style={{ minWidth: 250 }}>
              <PlayerSelect
                value={winnerOpt}
                onChange={setWinnerOpt}
                options={playerOptions}
                placeholder="勝者を選択"
                mode="select"
              />
            </div>

            <div style={{ minWidth: 250 }}>
              <PlayerSelect
                value={loserOpt}
                onChange={setLoserOpt}
                options={playerOptions}
                placeholder="敗者を選択"
                mode="select"
              />
            </div>

            <Input
              type="datetime-local"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              width={180}
            />

            <button type="submit" className={styles.registerButton}>
              登録
            </button>
          </form>
        )}
      </div>

      {/* ---------- ページネーション ---------- */}
      {mode === 'date' && (
        <div className={styles.paginationBar}>
          <button
            type="button"
            onClick={() => nextDate && fetchResults({ date: nextDate })}
            disabled={!nextDate}
            className={styles.pageButton}
          >
            次の日
          </button>

          <span className={styles.pageDate}>{date ?? 'データなし'}</span>

          <button
            type="button"
            onClick={() => prevDate && fetchResults({ date: prevDate })}
            disabled={!prevDate}
            className={styles.pageButton}
          >
            前の日
          </button>
        </div>
      )}

      {/* ---------- テーブル ---------- */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataTable
            tableClass={styles.table}
            rows={results}
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