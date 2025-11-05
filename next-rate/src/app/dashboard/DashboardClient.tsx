'use client';

import styles from './Dashboard.module.css';

export default function DashboardClient() {
  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <header className={styles.menuBar}>
        <h1 className={styles.menuTitle}>トップメニュー</h1>
        <div className={styles.menuActions}>
          <button
            className={styles.navButton}
            onClick={() => location.href = '/api/auth/signout'}
          >
            ログアウト
          </button>
          <button
            className={styles.navButton}
            onClick={() => {
              console.log('レーティング計算実行');
            }}
          >
            レーティング計算
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className={styles.main}>
        <div className={styles.grid}>
          <button className={styles.gridButton} onClick={() => location.href = '/admin'}>
            管理者管理
          </button>
          <button className={styles.gridButton} onClick={() => location.href = '/player'}>
            対局者管理
          </button>
          <button className={styles.gridButton} onClick={() => location.href = '/result'}>
            対局結果管理
          </button>
        </div>
      </main>
    </div>
  );
}