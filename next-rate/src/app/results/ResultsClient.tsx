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
  const [winnerFilter, setWinnerFilter] = useState<PlayerOption | null>(null);
  const [loserFilter, setLoserFilter] = useState<PlayerOption | null>(null);
  const [filteredResults, setFilteredResults] = useState<Result[]>(results);

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

  // 共通のオプションとスタイル
  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const customSelectStyles: StylesConfig<PlayerOption, false> = {
    option: (base, state) => ({
      ...base,
      color: 'black',
      backgroundColor: state.isFocused ? '#eee' : 'white',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'black',
    }),
    input: (base) => ({
      ...base,
      color: 'black',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#666',
    }),
  };

  const handleSearch = () => {
    let filtered = results;
    if (winnerFilter) {
      filtered = filtered.filter((r) => r.winnerId === winnerFilter.value);
    }
    if (loserFilter) {
      filtered = filtered.filter((r) => r.loserId === loserFilter.value);
    }
    setFilteredResults(filtered);
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
        <Select
          name="winnerId"
          options={playerOptions}
          placeholder="勝者を選択"
          styles={customSelectStyles}
          className={styles.input}
        />
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

      {/* 検索フォーム */}
      <div className={styles.formBar}>
        <Select
          options={playerOptions}
          value={winnerFilter}
          onChange={(option) => setWinnerFilter(option)}
          placeholder="勝者で絞り込み"
          styles={customSelectStyles}
          isClearable
          className={styles.input}
        />
        <Select
          options={playerOptions}
          value={loserFilter}
          onChange={(option) => setLoserFilter(option)}
          placeholder="敗者で絞り込み"
          styles={customSelectStyles}
          isClearable
          className={styles.input}
        />
        <button onClick={handleSearch} className={styles.registerButton}>
          検索
        </button>
      </div>

      {/* 一覧テーブル */}
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