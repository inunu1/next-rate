'use client';

import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css'; // ← CSSモジュールをインポート

type Props = {
  players: Player[];
  results: Result[];
};

export default function ResultsClient({ players, results }: Props) {
  return (
    <div className={styles.container}>
      {/* タイトルバー */}
      <div className={styles.menuBar}>
        <h1 className={styles.title}>対局結果管理</h1>
        <form action="/dashboard" method="get">
          <button type="submit" className={styles.actionButton}>Dashboardへ</button>
        </form>
      </div>

      {/* 登録フォーム */}
      <form action="/results/register" method="post" className={styles.formBar}>
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
        <input type="datetime-local" name="playedAt" required className={styles.input} />
        <button type="submit" className={styles.registerButton}>登録</button>
      </form>

      {/* 一覧テーブル */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>日時</th>
            <th>勝者（開始時）</th>
            <th>敗者（開始時）</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.playedAt).toLocaleString('ja-JP')}</td>
              <td>{r.winnerName}（{r.winnerRate}）</td>
              <td>{r.loserName}（{r.loserRate}）</td>
              <td>
                <form action="/results/delete" method="post">
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className={styles.actionButton}>削除</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}