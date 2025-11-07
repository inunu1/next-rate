'use client';

import styles from './Admin.module.css';
import { AdminUser } from '@/types/admin';

type Props = {
  users: AdminUser[];
};

export default function AdminClient({ users }: Props) {
  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <header className={styles.menuBar}>
        <h1 className={styles.title}>管理者管理</h1>
      </header>

      {/* フォームバー */}
      <form action="/admin/register" method="POST" className={styles.formBar}>
        <input name="email" type="email" placeholder="email" required className={styles.input} />
        <input name="name" type="text" placeholder="name" className={styles.input} />
        <input name="password" type="password" placeholder="password" required className={styles.input} />
        <button type="submit" className={styles.registerButton}>管理者登録</button>
      </form>

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
                  <button className={styles.actionButton}>編集</button>
                  <button className={styles.actionButton}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}