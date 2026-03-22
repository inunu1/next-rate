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
 * 非責務　：DB アクセス（API 側で実施）、認証（page.tsx 側で実施）
 * ============================================================================
 */
export default function ResultsClient() {
  /* ==========================================================================
   * 1. 状態管理（State）
   * ========================================================================== */

  /** 初期マウント判定（SSR → CSR 切替用） */
  const [mounted, setMounted] = useState(false);

  /** プレイヤー一覧 */
  const [players, setPlayers] = useState<Player[]>([]);

  /** 対局結果一覧 */
  const [results, setResults] = useState<Result[]>([]);

  /** 日付ページネーション情報 */
  const [date, setDate] = useState<string | null>(null);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  /** 検索条件（playerId / date） */
  const [playerOpt, setPlayerOpt] = useState<PlayerOption | null>(null);
  const [searchDate, setSearchDate] = useState<string>(''); // ← 単日検索追加

  /** 登録フォーム */
  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [playedAt, setPlayedAt] = useState('');

  /** タブ切替（検索／登録） */
  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');

  /* ==========================================================================
   * 2. 初期表示処理（プレイヤー一覧 + 最新日付の対局取得）
   * ========================================================================== */
  useEffect(() => {
    setMounted(true);
    fetchPlayers();
    fetchResults(); // 最新日付の対局
  }, []);

  if (!mounted) return null;

  /* ==========================================================================
   * 3. API 呼び出し関数群
   * ========================================================================== */

  /** プレイヤー一覧取得 */
  async function fetchPlayers() {
    const res = await fetch('/api/private/player');
    const data = await res.json();
    setPlayers(data);
  }

  /** PlayerSelect 用オプション */
  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /** 対局結果取得（playerId / date の2軸） */
  async function fetchResults(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`/api/private/result${query}`);
    const data = await res.json();

    setResults(Array.isArray(data.results) ? data.results : []);
    setDate(data.date ?? null);
    setPrevDate(data.prevDate ?? null);
    setNextDate(data.nextDate ?? null);
  }

  /** 対局結果登録 */
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

    fetchResults(); // 最新日付へ戻る
  };

  /** 対局結果削除 */
  const handleDelete = async (id: string) => {
    if (!confirm('この対局結果を削除しますか？')) return;

    await fetch(`/api/private/result?id=${id}`, { method: 'DELETE' });
    await fetch('/api/private/calculate', { method: 'POST' });

    alert('削除が完了しました');

    if (date) {
      fetchResults({ date });
    } else {
      fetchResults();
    }
  };

  /** 検索（playerId / date の2軸） */
  const handleSearch = () => {
    const params: Record<string, string> = {};

    if (playerOpt) params.playerId = playerOpt.value;
    if (searchDate) params.date = searchDate;

    fetchResults(params);
  };

  /* ==========================================================================
   * 4. UI（表示部）
   * ========================================================================== */
  return (
    <div className={styles.container}>
      {/* ------------------------------------------------------------
       * 画面ヘッダ
       * ------------------------------------------------------------ */}
      <header className={styles.header}>
        <h1 className={styles.title}>対局結果管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* ------------------------------------------------------------
       * 検索／登録タブ
       * ------------------------------------------------------------ */}
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

        {/* ------------------------------------------------------------
         * 検索フォーム（playerId / date）
         * ------------------------------------------------------------ */}
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
          /* ------------------------------------------------------------
           * 登録フォーム
           * ------------------------------------------------------------ */
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

      {/* ------------------------------------------------------------
       * 日付ページネーション（prev/next がある場合のみ表示）
       * ------------------------------------------------------------ */}
      {(prevDate || nextDate) && (
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

      {/* ------------------------------------------------------------
       * 対局結果テーブル
       * ------------------------------------------------------------ */}
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