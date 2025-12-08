'use client';

import styles from './Players.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';

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

      <form action="/players/register" method="POST" className={styles.formBar}>
        <input name="name" type="text" placeholder="ユーザー名" required className={styles.input} />
        <input name="initialRate" type="number" placeholder="初期レート（4桁）" required min={1000} max={9999} className={styles.input} />
        <button type="submit" className={styles.registerButton}>対局者登録</button>
      </form>

      <main className={styles.main}>
        <DataTable
          tableClass={styles.table}
          rows={players}
          columns={[
            { header: "プレイヤー名", render: (p) => p.name },
            { header: "現在レート", render: (p) => p.currentRate },
            { header: "初期レート", render: (p) => p.initialRate },
            {
              header: "操作",
              render: (p) =>
                p.id !== currentUserId && (
                  <form action="/players/delete" method="POST">
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={styles.actionButton}>出禁</button>
                  </form>
                ),
            },
          ]}
        />
      </main>
    </div>
  );
}