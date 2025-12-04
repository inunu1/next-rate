'use client';

import styles from './Players.module.css';

type Player = {
  id: string;
  name: string;
  initialRate: number;
  currentRate: number;
  deletedAt?: Date | null; // 論理削除用フィールド
};

type Props = {
  players: Player[];
  currentUserId: string;
};

export default function PlayersClient({ players, currentUserId }: Props) {
  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <header className={styles.menuBar}>
        <h1 className={styles.title}>対局者管理</h1>
        <nav className={styles.nav}>
          <button
            className={styles.actionButton}
            onClick={() => (location.href = '/dashboard')}
          >
            Dashboard
          </button>
        </nav>
      </header>

      {/* 登録フォームバー */}
      <form action="/players/register" method="POST" className={styles.formBar}>
        <input
          name="name"
          type="text"
          placeholder="ユーザー名"
          required
          className={styles.input}
        />
        <input
          name="initialRate"
          type="number"
          placeholder="初期レート（4桁）"
          required
          min={1000}
          max={9999}
          className={styles.input}
        />
        <button type="submit" className={styles.registerButton}>
          対局者登録
        </button>
      </form>

      {/* 一覧表示 */}
      <main className={styles.main}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>プレイヤー名</th>
              <th>現在レート</th>
              <th>初期レート</th>
              <th>有効 / 出禁</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id}>
                <td>{player.name}</td>
                <td>{player.currentRate}</td>
                <td>{player.initialRate}</td>
                <td>
                  {player.id !== currentUserId && (
                    <form
                      action="/players/toggle-ban"
                      method="POST"
                      style={{ display: 'inline' }}
                    >
                      <input type="hidden" name="id" value={player.id} />
                      <input
                        type="checkbox"
                        name="banned"
                        defaultChecked={!!player.deletedAt}
                        onChange={(e) => e.currentTarget.form?.submit()}
                        className={styles.input}
                      />
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}