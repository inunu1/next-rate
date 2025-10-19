'use client';

import Link from 'next/link';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ダッシュボード</h1>

      <div className={styles.grid}>
        <Link href="/users-management" className={styles.buttonBlue}>
          管理者追加
        </Link>
        <Link href="/players-management" className={styles.buttonBlue}>
          対局管理画面
        </Link>
        <Link href="/results-management" className={styles.buttonBlue}>
          勝敗管理画面
        </Link>
      </div>

      <div className={styles.grid}>
        <Link href="/users-management" className={styles.buttonBlue}>
          管理者検索
        </Link>
        <Link href="/players-management" className={styles.buttonBlue}>
          対局管理画面
        </Link>
        <Link href="/results-management" className={styles.buttonBlue}>
          勝敗管理画面
        </Link>
      </div>

      <div className={styles.grid}>
        <Link href="/users-management" className={styles.buttonBlue}>
          管理者編集
        </Link>
        <Link href="/players-management" className={styles.buttonBlue}>
          対局管理画面
        </Link>
        <Link href="/results-management" className={styles.buttonBlue}>
          勝敗管理画面
        </Link>
      </div>

      <div className={styles.grid}>
        <Link href="/users-management" className={styles.buttonBlue}>
          管理者削除
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