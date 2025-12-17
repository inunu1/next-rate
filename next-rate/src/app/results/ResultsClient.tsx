'use client';

import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import Select from 'react-select';

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

  // react-select 用のオプション
  const playerOptions = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // 文字色を黒にするカスタムスタイル
  const customSelectStyles = {
    option: (base: any, state: any) => ({
      ...base,
      color: 'black', // プルダウン内の文字色
      backgroundColor: state.isFocused ? '#eee' : 'white',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'black', // 選択後の文字色
    }),
    input: (base: any) => ({
      ...base,
      color: 'black', // 入力中の文字色
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#666', // プレースホルダー文字色
    }),
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
          nav: styles.nav,
          actionButton: styles.actionButton,
        }}
      />

      {/* 登録フォーム */}
      <form
        action="/results/register"
        method="post"
        className={styles.formBar}
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await fetch('/results/register', { method: 'POST', body: fd });
          await handleRecalculate();
        }}
      >
        {/* 勝者選択 */}
        <Select
          name="winnerId"
          options={playerOptions}
          placeholder="勝者を選択"
          styles={customSelectStyles}
          className={styles.input}
        />

        {/* 敗者選択 */}
        <Select
          name="loserId"
          options={playerOptions}
          placeholder="敗者を選択"
          styles={customSelectStyles}
          className={styles.input}
        />

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