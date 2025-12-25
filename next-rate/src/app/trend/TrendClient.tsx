'use client';

import { useState } from 'react';
import styles from './Trend.module.css';
import MenuBar from '@/components/MenuBar';
import CreatableSelect from 'react-select/creatable';
import { StylesConfig, SingleValue } from 'react-select';
import RateChart from './RateChart';

type Player = {
  id: string;
  name: string | null;
};

type Option = {
  value: string;
  label: string;
};

type RatePoint = {
  date: string;
  rate: number;
};

type Props = {
  players: Player[];
};

export default function TrendClient({ players }: Props) {
  const [selected, setSelected] = useState<Option | null>(null);
  const [history, setHistory] = useState<RatePoint[]>([]);

  const playerOptions: Option[] = players.map((p) => ({
    value: p.id,
    label: p.name ?? '(名前なし)',
  }));

  const customSelectStyles: StylesConfig<Option, false> = {
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
    singleValue: (base) => ({ ...base, color: 'black' }),
    input: (base) => ({ ...base, color: 'black' }),
    option: (base, state) => ({
      ...base,
      color: 'black',
      backgroundColor: state.isFocused ? '#eee' : 'white',
    }),
    placeholder: (base) => ({ ...base, color: '#666' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const fetchHistory = async (playerId: string) => {
    const res = await fetch(`/api/trend/${playerId}`);
    const data: RatePoint[] = await res.json();
    setHistory(data);
  };

  return (
    <div className={styles.container}>
      {/* --- MenuBar（PlayersClient と完全統一） --- */}
      <MenuBar
        title="レート推移"
        actions={[{ label: 'メニュー', href: '/dashboard' }]}
        styles={{
          menuBar: styles.menuBar,
          title: styles.title,
          nav: styles.nav,
          actionButton: styles.actionButton,
        }}
      />

      {/* --- 横並びフォームバー（PlayersClient と同じ構成） --- */}
      <div className={styles.formBar}>
        <div className={styles.selectWrapper}>
          <CreatableSelect
            options={playerOptions}
            value={selected}
            onChange={(opt: SingleValue<Option>) => {
              setSelected(opt ?? null);
              if (opt) fetchHistory(opt.value);
            }}
            placeholder="プレイヤー検索"
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
        </div>

        {/* 出力ボタン（CSV や画像出力などに使える） */}
        <button
          type="button"
          className={styles.searchButton}
          onClick={() => {
            if (!history.length) {
              alert('データがありません');
              return;
            }
            alert('出力機能はまだ未実装です');
          }}
        >
          出力
        </button>
      </div>

      {/* --- グラフ --- */}
      {history.length > 0 && <RateChart data={history} />}
    </div>
  );
}