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
            <li><a href="/logout" className={styles.navItem}>ログアウト</a></li>
          </ul>
        </nav>
      </header>

      {/* 登録フォームバー */}
      <form action="/admin/register" method="POST" className={styles.formBar}>
        <input
          name="email"
          type="email"
          placeholder="メールアドレス"
          required
          className={styles.input}
        />
        <input
          name="name"
          type="text"
          placeholder="名前（任意）"
          className={styles.input}
        />
        <input
          name="password"
          type="password"
          placeholder="パスワード"
          required
          className={styles.input}
        />
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