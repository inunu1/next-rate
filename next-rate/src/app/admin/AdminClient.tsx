'use client';

import { useState } from 'react';
import styles from './Admin.module.css';
import { AdminUser } from '@/types/admin';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import CreatableSelect from 'react-select/creatable';
import { StylesConfig } from 'react-select';

type Props = {
  users: AdminUser[];
  currentUserId: string;
};

type AdminOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export default function AdminClient({ users, currentUserId }: Props) {
  const [selected, setSelected] = useState<AdminOption | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  // 名前で検索する
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

    const fd = new FormData();
    fd.append('email', email);
    fd.append('name', selected.label);
    fd.append('password', password);

    await fetch('/admin/register', { method: 'POST', body: fd });
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

      {/* 横並びフォームバー */}
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
                  <form action="/admin/delete" method="POST">
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className={styles.actionButton}>
                      削除
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