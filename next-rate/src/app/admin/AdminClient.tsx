'use client';

import { useState } from 'react';
import styles from './Admin.module.css';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import CreatableSelect from 'react-select/creatable';
import { StylesConfig } from 'react-select';

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  users: AdminUser[];
  currentUserId: string;
};

type AdminOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

// /api/private 用の型
type ApiBody = {
  action: 'create' | 'update' | 'delete' | 'list' | 'get';
  table: 'user';
  id?: string;
  data?: Record<string, unknown>;
  select?: Record<string, boolean>;
};

export default function AdminClient({ users, currentUserId }: Props) {
  const [selected, setSelected] = useState<AdminOption | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  const adminOptions: AdminOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? '(名前なし)',
  }));

  const customSelectStyles: StylesConfig<AdminOption, false> = {
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

  // 共通 API 呼び出し
  async function callApi(body: ApiBody) {
    const res = await fetch('/api/private', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // 新規登録
  const handleRegister = async () => {
    if (!selected || !selected.__isNew__) {
      alert('新規管理者の名前を入力してください');
      return;
    }
    if (!email) {
      alert('メールアドレスを入力してください');
      return;
    }
    if (!password) {
      alert('パスワードを入力してください');
      return;
    }

    await callApi({
      action: 'create',
      table: 'user',
      data: {
        name: selected.label,
        email,
        password,
      },
    });

    location.reload();
  };

  // 名前検索
  const handleSearch = () => {
    if (!selected || selected.__isNew__) {
      setFilteredUsers(users);
      return;
    }
    setFilteredUsers(users.filter((u) => u.id === selected.value));
  };

  // 削除（物理削除）
  const handleDelete = async (id: string) => {
    await callApi({
      action: 'delete',
      table: 'user',
      id,
    });

    location.reload();
  };

  return (
    <div className={styles.container}>
      <MenuBar
        title="管理者管理"
        actions={[{ label: 'メニュー', href: '/dashboard' }]}
        styles={{
          menuBar: styles.menuBar,
          title: styles.title,
          nav: styles.nav,
          actionButton: styles.actionButton,
        }}
      />

      <div className={styles.formBar}>
        <div className={styles.selectWrapper}>
          <CreatableSelect
            options={adminOptions}
            value={selected}
            onChange={(opt) => setSelected(opt)}
            placeholder="名前検索 / 新規入力"
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          />
        </div>

        <input
          type="email"
          placeholder="メールアドレス（新規登録時）"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />

        <input
          type="password"
          placeholder="パスワード（新規登録時）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          rows={filteredUsers}
          columns={[
            { header: 'Email', render: (u) => u.email },
            { header: 'Name', render: (u) => u.name ?? '未設定' },
            {
              header: '操作',
              render: (u) =>
                u.id !== currentUserId && (
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => handleDelete(u.id)}
                  >
                    削除
                  </button>
                ),
            },
          ]}
        />
      </main>
    </div>
  );
}