'use client';

import Link from 'next/link';
import styles from './users-management.module.css';

export default function Page() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ダッシュボード</h1>

      <div className={styles.grid}>
        <Link href="/users-management" className={styles.buttonBlue}>
          管理者画面
        </Link>
        <Link href="/players-management" className={styles.buttonBlue}>
          対局管理画面
        </Link>
        <Link href="/results-management" className={styles.buttonBlue}>
          勝敗管理画面
        </Link>
      </div>
    </main>
  );
}