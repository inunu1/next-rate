'use client';

import styles from './Players.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import RegisterForm from '@/components/RegisterForm';
import DeleteForm from '@/components/DeleteForm';

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

export default function PlayersClient({ players, currentUserId }: Props) {
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
          { name: "name", type: "text", placeholder: "ユーザー名", required: true },
          { name: "initialRate", type: "number", placeholder: "初期レート（4桁）", required: true, min: 1000, max: 9999 },
        ]}
      />

      <main className={styles.main}>
        <DataTable
          tableClass={styles.table}
          rows={players}
          columns={[
            { header: "プレイヤー名", render: (p) => p.name },
            { header: "現在レート", render: (p) => p.currentRate },
            { header: "初期レート", render: (p) => p.initialRate },
            {
              header: "操作",
              render: (p) =>
                p.id !== currentUserId && (
                  <DeleteForm
                    action="/players/delete"
                    id={p.id}
                    buttonLabel="出禁"
                    className={styles.actionButton}
                  />
                ),
            },
          ]}
        />
      </main>
    </div>
  );
}