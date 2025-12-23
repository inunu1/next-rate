'use client';

import { useState } from 'react';
import styles from './Players.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import Select, { StylesConfig } from 'react-select';

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
};

export default function PlayersClient({ players, currentUserId }: Props) {
  const [name, setName] = useState('');
  const [initialRate, setInitialRate] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
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

  // 登録処理
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !initialRate) {
      alert('ユーザー名と初期レートは必須です');
      return;
    }

    const fd = new FormData();
    fd.append('name', name);
    fd.append('initialRate', initialRate);

    await fetch('/players/register', { method: 'POST', body: fd });
    location.reload();
  };

  // 検索処理
  const handleSearch = () => {
    if (!selectedPlayer) {
      setFilteredPlayers(players);
      return;
    }
    setFilteredPlayers(players.filter((p) => p.id === selectedPlayer.value));
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
      <form className={styles.formBar} onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="ユーザー名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />

        <input
          type="number"
          placeholder="初期レート（4桁）"
          value={initialRate}
          onChange={(e) => setInitialRate(e.target.value)}
          min={1000}
          max={9999}
          className={styles.input}
        />

        <div className={styles.selectWrapper}>
          <Select
            options={playerOptions}
            value={selectedPlayer}
            onChange={(option) => setSelectedPlayer(option)}
            placeholder="プレイヤー検索"
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
        </div>

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
                  <form action="/players/delete" method="POST">
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