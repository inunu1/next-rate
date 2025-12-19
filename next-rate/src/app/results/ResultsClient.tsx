'use client';

import { useState } from 'react';
import type { Player, Result } from '@prisma/client';
import styles from './Results.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import Select, { StylesConfig } from 'react-select';

type Props = {
  players: Player[];
  results: Result[];
};

type PlayerOption = {
  value: string;
  label: string;
};

export default function ResultsClient({ players, results }: Props) {
  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [playedAt, setPlayedAt] = useState('');
  const [filteredResults, setFilteredResults] = useState(results);

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

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const customSelectStyles: StylesConfig<PlayerOption, false> = {
    control: (base) => ({
      ...base,
      minHeight: 42,
      height: 42,
      borderRadius: 6,
      borderColor: '#aaa',
    }),
    valueContainer: (base) => ({
      ...base,
      height: 42,
      padding: '0 8px',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'black',
    }),
    input: (base) => ({
      ...base,
      color: 'black',
    }),
    option: (base, state) => ({
      ...base,
      color: 'black',
      backgroundColor: state.isFocused ? '#eee' : 'white',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#666',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!winnerOpt || !loserOpt || !playedAt) {
      alert('勝者・敗者・対局日時は必須です');
      return;
    }
    if (winnerOpt.value === loserOpt.value) {
      alert('勝者と敗者は別のプレイヤーを選んでください');
      return;
    }

    const fd = new FormData();
    fd.append('winnerId', winnerOpt.value);
    fd.append('loserId', loserOpt.value);
    fd.append('playedAt', playedAt);

    await fetch('/results/register', { method: 'POST', body: fd });
    await handleRecalculate();
  };

  const handleSearch = () => {
    let next = results;
    if (winnerOpt) next = next.filter((r) => r.winnerId === winnerOpt.value);
    if (loserOpt) next = next.filter((r) => r.loserId === loserOpt.value);
    setFilteredResults(next);
  };

  return (
    <div className={styles.container}>
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

      {/* 1行にすべて並べるフォーム */}
      <form className={styles.formBar} onSubmit={handleRegister}>
        <div className={styles.selectWrapper}>
          <Select
            options={playerOptions}
            value={winnerOpt}
            onChange={setWinnerOpt}
            placeholder="勝者を選択"
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
        </div>

        <div className={styles.selectWrapper}>
          <Select
            options={playerOptions}
            value={loserOpt}
            onChange={setLoserOpt}
            placeholder="敗者を選択"
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
        </div>

        <input
          type="datetime-local"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          className={styles.input}
          placeholder="対局日時"
        />

        <button type="submit" className={styles.registerButton}>
          登録
        </button>

        <button
          type="button"
          onClick={handleSearch}
          className={styles.searchButton}
        >
          検索
        </button>
      </form>

      <DataTable
        tableClass={styles.table}
        rows={filteredResults}
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