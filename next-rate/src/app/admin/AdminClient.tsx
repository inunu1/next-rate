'use client';

import styles from './Admin.module.css';
import { AdminUser } from '@/types/admin';

type Props = {
  users: AdminUser[];
  currentUserId: string;
};

export default function AdminClient({ users, currentUserId }: Props) {
  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <header className={styles.menuBar}>
        <h1 className={styles.title}>管理者管理</h1>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li><a href="/admin" className={styles.navItem}>一覧</a></li>
            <li><a href="/admin/register" className={styles.navItem}>登録</a></li>
            <li><a href="/logout" className={styles.navItem}>ログアウト</a></li>
          </ul>
        </nav>
      </header>

      {/* 一覧表示 */}
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
                  {user.id !== currentUserId && (
                    <form action="/admin/delete" method="POST">
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