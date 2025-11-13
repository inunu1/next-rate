"use client";

import styles from "./Players.module.css";

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

export default function PlayersClient({ players, currentUserId }: Props) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>対局者管理画面</h1>
        <a href="/dashboard">Dashboard</a>
      </header>

      <form method="POST" action="/players/register" className={styles.form}>
        <input name="name" type="text" placeholder="ユーザー名" required maxLength={50} className={styles.input} />
        <input name="initialRate" type="number" placeholder="初期レート（4桁）" required min={1000} max={9999} className={styles.input} />
        <button type="submit" className={styles.button}>登録</button>
      </form>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>プレイヤー名</th>
            <th className={styles.th}>現在レート</th>
            <th className={styles.th}>初期レート</th>
            <th className={styles.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td className={styles.td}>{p.name}</td>
              <td className={styles.td}>{p.currentRate}</td>
              <td className={styles.td}>{p.initialRate}</td>
              <td className={styles.td}>
                {p.id !== currentUserId && (
                  <form method="POST" action="/players/update" className={styles.form}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="number" name="currentRate" placeholder="新レート" required min={1000} max={9999} className={styles.input} />
                    <button type="submit" className={styles.button}>編集</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}