'use client';

import styles from './Results.module.css';

type Player = { id: string; name: string };
type Result = {
  id: string;
  winnerId: string;
  winnerName: string;
  winnerRate: number;
  loserId: string;
  loserName: string;
  loserRate: number;
  playedAt: string;
  updatedAt: string;
};

type Props = {
  players: Player[];
  results: Result[];
};

export default function ResultsClient({ players, results }: Props) {
  return (
    <div className={styles.container}>
      <header className={styles.menuBar}>
        <h1 className={styles.title}>対局結果管理</h1>
        <nav className={styles.nav}>
          <button className={styles.actionButton} onClick={() => location.href = '/dashboard'}>
            Dashboard
          </button>
        </nav>
      </header>

      <form action="/results/register" method="POST" className={styles.formBar}>
        <select name="winnerId" required className={styles.input}>
          <option value="">勝者</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="loserId" required className={styles.input}>
          <option value="">敗者</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit" className={styles.registerButton}>対局登録</button>
      </form>

      <main className={styles.main}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>勝者</th>
              <th>敗者</th>
              <th>勝者レート</th>
              <th>敗者レート</th>
              <th>レート差</th>
              <th>対局日時</th>
              <th>更新日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {results.map(result => (
              <tr key={result.id}>
                <td>{result.winnerName}</td>
                <td>{result.loserName}</td>
                <td>{result.winnerRate}</td>
                <td>{result.loserRate}</td>
                <td>{result.winnerRate - result.loserRate}</td>
                <td>{new Date(result.playedAt).toLocaleString()}</td>
                <td>{new Date(result.updatedAt).toLocaleString()}</td>
                <td>
                  <form action="/results/delete" method="POST">
                    <input type="hidden" name="id" value={result.id} />
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