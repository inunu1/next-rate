'use client';

import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import MenuBar from '@/components/MenuBar';

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
      {/* タイトルバー（共通化） */}
      <MenuBar
        title="対局結果管理"
        actions={[{ label: 'メニュー', href: '/dashboard' }]}
        styles={{
          menuBar: styles.menuBar,
          title: styles.title,
          nav: styles.nav, // nav 用のクラスがなければ menuBar を流用
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
              <td>
                {r.winnerName}（{r.winnerRate}）
              </td>
              <td>
                {r.loserName}（{r.loserRate}）
              </td>
              <td>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}