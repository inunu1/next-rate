'use client';

import { useState } from 'react';
import styles from './Players.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import RegisterForm from '@/components/RegisterForm';
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

// react-select 用のオプション型
type PlayerOption = {
  value: string;
  label: string;
};

// 黒文字スタイル
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

export default function PlayersClient({ players, currentUserId }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // 選択されたプレイヤーでフィルタ
  const filteredPlayers =
    selectedPlayer === null
      ? players
      : players.filter((p) => p.id === selectedPlayer.value);

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

      <RegisterForm
        action="/players/register"
        submitLabel="対局者登録"
        classNames={{
          formBar: styles.formBar,
          input: styles.input,
          submitButton: styles.registerButton,
        }}
        fields={[
          { name: 'name', type: 'text', placeholder: 'ユーザー名', required: true },
          {
            name: 'initialRate',
            type: 'number',
            placeholder: '初期レート（4桁）',
            required: true,
            min: 1000,
            max: 9999,
          },
        ]}
      />

      {/* 検索付きセレクト */}
      <div className={styles.formBar}>
        <Select
          options={playerOptions}
          value={selectedPlayer}
          onChange={(option) => setSelectedPlayer(option)}
          placeholder="プレイヤー検索"
          styles={customSelectStyles}
          isClearable
          className={styles.input}
        />
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