'use client';

import Link from 'next/link';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ダッシュボード</h1>

      {/* その他のリンク */}
      <div className={styles.grid}>
        <Link href="/dashboard/user-management">
          <div className={styles.cardBlue}>ユーザー管理画面</div>
        </Link>
        <Link href="/dashboard/member-management">
          <div className={styles.cardGreen}>会員管理画面</div>
        </Link>
        <Link href="/dashboard/match-management">
          <div className={styles.cardYellow}>勝敗管理画面</div>
        </Link>
      </div>
    </main>
  );
}