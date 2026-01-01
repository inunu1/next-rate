'use client';

import { useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import RateChart from './RateChart';
import { SingleValue } from 'react-select';
import styles from './Trend.module.css';

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

  const options: Option[] = players.map((p) => ({
    value: p.id,
    label: p.name ?? '(名前なし)',
  }));

  const fetchHistory = async (playerId: string) => {
    const res = await fetch(`/api/trend/${playerId}`);
    const data: RatePoint[] = await res.json();
    setHistory(data);
  };

  return (
    <div className={styles.container}>
      {/* --- MenuBar（PlayersClient と統一） --- */}
      <div className={styles.menuBar}>
        <h1 className={styles.title}>レート推移</h1>
      </div>

      {/* --- FormBar（横並び + スマホ横スクロール） --- */}
      <div className={styles.formBar}>
        <div className={styles.selectWrapper}>
          <CreatableSelect
            options={options}
            value={selected}
            onChange={(opt: SingleValue<Option>) => {
              setSelected(opt ?? null);
              if (opt) fetchHistory(opt.value);
            }}
            placeholder="プレイヤー検索"
            isClearable
          />
        </div>
      </div>

      {/* --- グラフ --- */}
      {history.length > 0 && <RateChart data={history} />}
    </div>
  );
}