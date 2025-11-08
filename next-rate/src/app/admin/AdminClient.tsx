'use client';

import styles from './Admin.module.css';
import { AdminUser } from '@/types/admin';
import { useSession } from 'next-auth/react';

type Props = {
  users: AdminUser[];
};

export default function AdminClient({ users }: Props) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  return (
    <div className={styles.container}>
      <header className={styles.menuBar}>
        <h1 className={styles.title}>管理者管理</h1>
      </header>

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
                  {/* 編集ボタン（未実装） */}
                  <button className={styles.actionButton}>編集</button>

                  {/* 削除フォーム（ログイン中ユーザーは非表示） */}
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