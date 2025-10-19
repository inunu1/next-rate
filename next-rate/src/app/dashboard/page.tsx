'use client';

import Link from 'next/link';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  return (
    <>
      {/* 🔝 メニューバー */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <h1 className={styles.logo}>管理システム</h1>
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>管理者管理</Link>
            <Link href="/settings" className={styles.navLink}>対局者管理</Link>
            <Link href="/logout" className={styles.navLink}>勝敗管理</Link>
          </nav>
        </div>
      </header>

      {/* 📦 メインコンテンツ */}
      <main className={styles.main}>
        <h2 className={styles.title}>ダッシュボード</h2>

        {/* 各セクション */}
        <div className={styles.grid}>
          <Link href="/users-management" className={styles.buttonBlue}>管理者追加</Link>
          <Link href="/players-management" className={styles.buttonBlue}>対局管理画面</Link>
          <Link href="/results-management" className={styles.buttonBlue}>勝敗管理画面</Link>
        </div>

        <div className={styles.grid}>
          <Link href="/users-management" className={styles.buttonBlue}>管理者検索</Link>
          <Link href="/players-management" className={styles.buttonBlue}>対局管理画面</Link>
          <Link href="/results-management" className={styles.buttonBlue}>勝敗管理画面</Link>
        </div>

        <div className={styles.grid}>
          <Link href="/users-management" className={styles.buttonBlue}>管理者編集</Link>
          <Link href="/players-management" className={styles.buttonBlue}>対局管理画面</Link>
          <Link href="/results-management" className={styles.buttonBlue}>勝敗管理画面</Link>
        </div>

        <div className={styles.grid}>
          <Link href="/users-management" className={styles.buttonBlue}>管理者削除</Link>
          <Link href="/players-management" className={styles.buttonBlue}>対局管理画面</Link>
          <Link href="/results-management" className={styles.buttonBlue}>勝敗管理画面</Link>
        </div>
      </main>
    </>
  );
}