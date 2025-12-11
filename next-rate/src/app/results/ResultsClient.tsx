'use client';

import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import DeleteForm from '@/components/DeleteForm';

type Props = {
  players: Player[];
  results: Result[];
};

export default function ResultsClient({ players, results }: Props) {
  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <MenuBar
        title="対局結果管理"
        actions={[{ label: 'メニュー', href: '/dashboard' }]}
        styles={{
          menuBar: styles.menuBar,
          title: styles.title,
          nav: styles.nav ?? styles.menuBar,
          actionButton: styles.actionButton,
        }}
      />

      {/* 登録フォーム（純粋なHTML送信） */}
      <form action="/results/register" method="POST" className={styles.formBar}>
        <select name="winnerId" required className={styles.input}>
          <option value="">勝者を選択</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select name="loserId" required className={styles.input}>
          <option value="">敗者を選択</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          name="playedAt"
          required
          className={styles.input}
        />

        <button type="submit" className={styles.registerButton}>
          登録
        </button>
      </form>

      {/* 一覧テーブル */}
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
              <DeleteForm
                action="/results/delete"
                id={r.id}
                buttonLabel="削除"
                className={styles.actionButton}
              />
            ),
          },
        ]}
      />
    </div>
  );
}