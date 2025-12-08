'use client';

import styles from './Admin.module.css';
import { AdminUser } from '@/types/admin';
import MenuBar from '@/components/MenuBar';
import DataTable from '@/components/DataTable';
import RegisterForm from '@/components/RegisterForm';

type Props = {
  users: AdminUser[];
  currentUserId: string;
};

export default function AdminClient({ users, currentUserId }: Props) {
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

      <RegisterForm
        action="/admin/register"
        submitLabel="管理者登録"
        classNames={{
          formBar: styles.formBar,
          input: styles.input,
          submitButton: styles.registerButton,
        }}
        fields={[
          { name: "email", type: "email", placeholder: "メールアドレス", required: true },
          { name: "name", type: "text", placeholder: "名前（任意）" },
          { name: "password", type: "password", placeholder: "パスワード", required: true },
        ]}
      />

      <main className={styles.main}>
        <DataTable
          tableClass={styles.table}
          rows={users}
          columns={[
            { header: "Email", render: (u) => u.email },
            { header: "Name", render: (u) => u.name ?? "未設定" },
            {
              header: "操作",
              render: (u) =>
                u.id !== currentUserId && (
                  <form action="/admin/delete" method="POST">
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className={styles.actionButton}>削除</button>
                  </form>
                ),
            },
          ]}
        />
      </main>
    </div>
  );
}