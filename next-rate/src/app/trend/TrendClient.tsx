'use client';

import { useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import RateChart from './RateChart';
import { SingleValue } from 'react-select';

type Player = {
  id: string;
  name: string | null;
};

type Option = {
  value: string;
  label: string;
};

type Props = {
  players: Player[];
};

export default function TrendClient({ players }: Props) {
  const [selected, setSelected] = useState<Option | null>(null);
  const [history, setHistory] = useState([]);

  const options: Option[] = players.map((p) => ({
    value: p.id,
    label: p.name ?? '(名前なし)',
  }));

  const fetchHistory = async (playerId: string) => {
    const res = await fetch(`/api/trend/${playerId}`);
    const data = await res.json();
    setHistory(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>レート推移</h1>

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

      {history.length > 0 && <RateChart data={history} />}
    </div>
  );
}