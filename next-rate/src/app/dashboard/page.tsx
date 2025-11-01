'use client';

import { signOut } from 'next-auth/react';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  return (
    <>
      {/* 🔝 ナビゲーションバー */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <h1 className={styles.logo}>トップメニュー</h1>
          <nav className={styles.nav}>
            <button
              className={styles.navLink}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              ログアウト
            </button>
            <button
              className={styles.navLink}
              onClick={() => {
                // レーティング計算処理をここに実装
                console.log('レーティング計算処理');
              }}
            >
              レーティング計算
            </button>
          </nav>
        </div>
      </header>

      {/* 📦 メインコンテンツ */}
      <main className={styles.main}>
        <h2 className={styles.title}>機能選択</h2>

        <div className={styles.grid}>
          <button className={styles.buttonBlue} onClick={() => window.location.href = '/admin'}>
            管理者管理
          </button>
          <button className={styles.buttonBlue} onClick={() => window.location.href = '/player'}>
            対局者管理
          </button>
          <button className={styles.buttonBlue} onClick={() => window.location.href = '/result'}>
            対局結果管理
          </button>
        </div>
      </main>
    </>
  );
}