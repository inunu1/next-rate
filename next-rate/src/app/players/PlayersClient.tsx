'use client';

import styles from './Players.module.css';
import MenuBar from '@/components/MenuBar';

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
      {/* メニューバー */}
      <MenuBar
        title="対局者管理"
        actions={[{ label: 'メニュー', href: '/dashboard' }]}
        styles={{
          menuBar: styles.menuBar,
          title: styles.title,
          nav: styles.nav,
          actionButton: styles.actionButton,
        }}
      />

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
              <th>操作</th>
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
                      action="/players/delete"
                      method="POST"
                      style={{ display: 'inline' }}
                    >
                      <input type="hidden" name="id" value={player.id} />
                      <button type="submit" className={styles.actionButton}>
                        出禁
                      </button>
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