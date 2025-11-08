'use client';

import styles from './Admin.module.css';
import { AdminUser } from '@/types/admin';
import { useSession } from 'next-auth/react';

type Props = {
  users: AdminUser[];
};

export default function AdminClient({ users }: Props) {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;

  const currentUserId = session?.user?.id ?? '';

  return (
    <div className={styles.container}>
      <header className={styles.menuBar}>
        <h1 className={styles.title}>管理者管理</h1>
      </header>

      <form action="/admin/register" method="POST" className={styles.formBar}>
        <input name="email" type="email" placeholder="email" required className={styles.input} />
        <input name="name" type="text" placeholder="name" className={styles.input} />
        <input name="password" type="password" placeholder="password" required className={styles.input} />
        <button type="submit" className={styles.registerButton}>管理者登録</button>
      </form>

      <main className={styles.main}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name ?? '未設定'}</td>
                <td>
                  <button className={styles.actionButton}>編集</button>
                  {user.id !== currentUserId && (
                    <form action="/admin/delete" method="POST" style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={user.id} />
                      <button type="submit" className={styles.actionButton}>削除</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}