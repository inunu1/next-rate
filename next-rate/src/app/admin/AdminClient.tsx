'use client';

import styles from './Admin.module.css';
import { AdminUser } from '@/types/admin';

type Props = {
  users: AdminUser[];
  currentUserId: string;
};

export default function AdminClient({ users, currentUserId }: Props) {
  return (
    <table className={styles.table}>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>{user.name ?? '未設定'}</td>
            <td>
              {user.id !== currentUserId && (
                <form action="/admin/delete" method="POST">
                  <input type="hidden" name="id" value={user.id} />
                  <button type="submit">削除</button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}