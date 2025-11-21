'use client';

import styles from './Results.module.css';
import type { Player, Result as PrismaResult } from '@prisma/client';
import { useMemo } from 'react';

type ResultWithDate = Omit<PrismaResult, 'playedAt'> & {
  playedAt: Date;
};

type Props = {
  players: Player[];
  results: ResultWithDate[];
};

export default function ResultsClient({ players, results }: Props) {
  const formattedResults = useMemo(() => {
    return results.map((r) => ({
      ...r,
      playedAtFormatted: r.playedAt.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }, [results]);

  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <header className={styles.menuBar}>
        <h1 className={styles.title}>対局結果管理</h1>
        <nav>
          <button
            className={styles.actionButton}
            onClick={() => location.href = '/dashboard'}
          >
            Dashboard
          </button>
        </nav>
      </header>

      {/* 登録フォームバー */}
      <form action="/results/register" method="POST" className={styles.formBar}>
        <select name="winnerId" required className={styles.input}>
          <option value="">勝者を選択</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select name="loserId" required className={styles.input}>
          <option value="">敗者を選択</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button type="submit" className={styles.registerButton}>対局登録</button>
      </form>

      {/* 一覧表示 */}
      <main className={styles.main}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>日時</th>
              <th>勝者</th>
              <th>敗者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {formattedResults.map((r) => (
              <tr key={r.id}>
                <td>{r.playedAtFormatted}</td>
                <td>{r.winnerName}（{r.winnerRate}）</td>
                <td>{r.loserName}（{r.loserRate}）</td>
                <td>
                  <form action="/results/delete" method="POST" style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className={styles.actionButton}>削除</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}