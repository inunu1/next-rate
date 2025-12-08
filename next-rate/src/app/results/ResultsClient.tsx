'use client';

import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import RegisterForm from '@/components/RegisterForm';

type Props = {
  players: Player[];
  results: Result[];
};

export default function ResultsClient({ players, results }: Props) {
  const handleRecalculate = async () => {
    try {
      const res = await fetch('/api/rating/recalculate', { method: 'POST' });
      if (res.ok) {
        alert('レーティング再計算が完了しました');
        location.reload();
      } else {
        const data = await res.json();
        alert(`エラー: ${data.error ?? '再計算に失敗しました'}`);
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました');
    }
  };

  return (
    <div className={styles.container}>
      {/* 共通メニューバー */}
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

      {/* 登録フォーム（共通化） */}
      <RegisterForm
        action="/results/register"
        submitLabel="登録"
        classNames={{
          formBar: styles.formBar,
          input: styles.input,
          submitButton: styles.registerButton,
        }}
        fields={[
          { name: 'winnerId', type: 'text', placeholder: '勝者ID', required: true },
          { name: 'loserId', type: 'text', placeholder: '敗者ID', required: true },
          { name: 'playedAt', type: 'datetime-local', placeholder: '日時', required: true },
        ]}
        onSubmit={async () => {
          await fetch('/api/rating/recalculate', { method: 'POST' });
          location.reload();
        }}
      />

      {/* 一覧テーブル（共通化） */}
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
              <form
                action="/results/delete"
                method="post"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await fetch('/results/delete', { method: 'POST', body: fd });
                  await handleRecalculate();
                }}
              >
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className={styles.actionButton}>
                  削除
                </button>
              </form>
            ),
          },
        ]}
      />
    </div>
  );
}