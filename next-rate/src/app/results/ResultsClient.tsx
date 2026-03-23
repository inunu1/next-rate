'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import DataTable from '@/components/DataTable';
import PlayerSelect, { PlayerOption } from '@/components/PlayerSelect';
import Input from '@/components/Input';

/**
 * ============================================================================
 * 画面名　：対局結果管理（Client Component）
 * 画面概要：対局結果の検索（playerId / date）、日付ページネーション、登録、削除
 * 責務　　：UI 状態管理、API 呼び出し、画面遷移制御
 * ============================================================================
 */
export default function ResultsClient() {
  /* ==========================================================================
   * 1. 状態管理
   * ========================================================================== */

  const [mounted, setMounted] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const [date, setDate] = useState<string | null>(null);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  const [playerOpt, setPlayerOpt] = useState<PlayerOption | null>(null);
  const [searchDate, setSearchDate] = useState('');

  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [playedAt, setPlayedAt] = useState('');

  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');

  /* ==========================================================================
   * 2. 初期表示
   * ========================================================================== */
  useEffect(() => {
    setMounted(true);
    fetchPlayers();
    fetchResults(); // 最新日付
  }, []);

  if (!mounted) return null;

  /* ==========================================================================
   * 3. API 呼び出し
   * ========================================================================== */

  async function fetchPlayers() {
    const res = await fetch('/api/private/player');
    const data = await res.json();
    setPlayers(data);
  }

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  async function fetchResults(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`/api/private/result${query}`);
    const data = await res.json();

    setResults(Array.isArray(data.results) ? data.results : []);
    setDate(data.date ?? null);
    setPrevDate(data.prevDate ?? null);
    setNextDate(data.nextDate ?? null);
  }

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

    fetchResults(); // 最新日付へ
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この対局結果を削除しますか？')) return;

    await fetch(`/api/private/result?id=${id}`, { method: 'DELETE' });
    await fetch('/api/private/calculate', { method: 'POST' });

    alert('削除が完了しました');

    if (date) {
      fetchResults({
        date,
        ...(playerOpt ? { playerId: playerOpt.value } : {}),
      });
    } else {
      fetchResults();
    }
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};

    if (playerOpt) params.playerId = playerOpt.value;
    if (searchDate) params.date = searchDate;

    fetchResults(params);
  };

  /* ==========================================================================
   * 4. UI
   * ========================================================================== */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>対局結果管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

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
                value={playerOpt}
                onChange={setPlayerOpt}
                options={playerOptions}
                placeholder="プレイヤーで絞り込み"
                mode="select"
              />
            </div>

            <Input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              width={150}
            />

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

      {(prevDate || nextDate) && (
        <div className={styles.paginationBar}>
          <button
            type="button"
            onClick={() =>
              nextDate &&
              fetchResults({
                date: nextDate,
                ...(playerOpt ? { playerId: playerOpt.value } : {}),
              })
            }
            disabled={!nextDate}
            className={styles.pageButton}
          >
            次の日
          </button>

          <span className={styles.pageDate}>
            {date
              ? date
              : playerOpt
              ? '' // プレイヤー検索モードでは空ページが存在しない
              : 'データなし'}
          </span>

          <button
            type="button"
            onClick={() =>
              prevDate &&
              fetchResults({
                date: prevDate,
                ...(playerOpt ? { playerId: playerOpt.value } : {}),
              })
            }
            disabled={!prevDate}
            className={styles.pageButton}
          >
            前の日
          </button>
        </div>
      )}

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