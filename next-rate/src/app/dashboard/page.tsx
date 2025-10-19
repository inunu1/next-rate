'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<'admin' | 'player' | 'result'>('admin');

  return (
    <>
      {/* 🔝 メニューバー */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <h1 className={styles.logo}>管理システム</h1>
          <nav className={styles.nav}>
            <button onClick={() => setSelectedCategory('admin')} className={styles.navLink}>
              管理者管理
            </button>
            <button onClick={() => setSelectedCategory('player')} className={styles.navLink}>
              対局者管理
            </button>
            <button onClick={() => setSelectedCategory('result')} className={styles.navLink}>
              勝敗管理
            </button>
          </nav>
        </div>
      </header>

      {/* 📦 メインコンテンツ */}
      <main className={styles.main}>
        <h2 className={styles.title}>ダッシュボード</h2>

        {selectedCategory === 'admin' && (
          <div className={styles.grid}>
            <Link href="/users-management/add" className={styles.buttonBlue}>管理者追加</Link>
            <Link href="/users-management/search" className={styles.buttonBlue}>管理者検索</Link>
            <Link href="/users-management/edit" className={styles.buttonBlue}>管理者編集</Link>
            <Link href="/users-management/delete" className={styles.buttonBlue}>管理者削除</Link>
          </div>
        )}

        {selectedCategory === 'player' && (
          <div className={styles.grid}>
            <Link href="/players-management/list" className={styles.buttonBlue}>対局者一覧</Link>
            <Link href="/players-management/add" className={styles.buttonBlue}>対局者追加</Link>
            <Link href="/players-management/edit" className={styles.buttonBlue}>対局者編集</Link>
            <Link href="/players-management/delete" className={styles.buttonBlue}>対局者削除</Link>
          </div>
        )}

        {selectedCategory === 'result' && (
          <div className={styles.grid}>
            <Link href="/results-management/record" className={styles.buttonBlue}>勝敗記録</Link>
            <Link href="/results-management/search" className={styles.buttonBlue}>勝敗検索</Link>
            <Link href="/results-management/edit" className={styles.buttonBlue}>勝敗編集</Link>
            <Link href="/results-management/delete" className={styles.buttonBlue}>勝敗削除</Link>
          </div>
        )}
      </main>
    </>
  );
}