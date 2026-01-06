'use client';

import { useState } from 'react';
import styles from './Players.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import CreatableSelect from 'react-select/creatable';
import { StylesConfig } from 'react-select';

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

type PlayerOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export default function PlayersClient({ players, currentUserId }: Props) {
  const [selected, setSelected] = useState<PlayerOption | null>(null);
  const [initialRate, setInitialRate] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState(players);

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

  // 新規登録
  const handleRegister = async () => {
    if (!selected || !selected.__isNew__) {
      alert('新規プレイヤー名を入力してください');
      return;
    }
    if (!initialRate) {
      alert('初期レートを入力してください');
      return;
    }

    const fd = new FormData();
    fd.append('name', selected.label);
    fd.append('initialRate', initialRate);

    await fetch('/api/player/register', { method: 'POST', body: fd });
    location.reload();
  };

  // 検索
  const handleSearch = () => {
    if (!selected || selected.__isNew__) {
      setFilteredPlayers(players);
      return;
    }
    setFilteredPlayers(players.filter((p) => p.id === selected.value));
  };

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

      {/* 横並びフォームバー */}
      <div className={styles.formBar}>
        <div className={styles.selectWrapper}>
          <CreatableSelect
            options={playerOptions}
            value={selected}
            onChange={(opt) => setSelected(opt)}
            placeholder="プレイヤー検索 / 新規入力"
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
        </div>

        <input
          type="number"
          placeholder="初期レート（4桁）"
          value={initialRate}
          onChange={(e) => setInitialRate(e.target.value)}
          min={1000}
          max={9999}
          className={styles.input}
        />

        <button
          type="button"
          onClick={handleRegister}
          className={styles.registerButton}
        >
          登録
        </button>

        <button
          type="button"
          onClick={handleSearch}
          className={styles.searchButton}
        >
          検索
        </button>
      </div>

      <main className={styles.main}>
        <DataTable
          tableClass={styles.table}
          rows={filteredPlayers}
          columns={[
            { header: 'プレイヤー名', render: (p) => p.name },
            { header: '現在レート', render: (p) => p.currentRate },
            { header: '初期レート', render: (p) => p.initialRate },
            {
              header: '操作',
              render: (p) =>
                p.id !== currentUserId && (
                  <form action="/api/player/delete" method="POST">
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={styles.actionButton}>
                      出禁
                    </button>
                  </form>
                ),
            },
          ]}
        />
      </main>
    </div>
  );
}