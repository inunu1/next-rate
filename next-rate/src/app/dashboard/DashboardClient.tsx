'use client';

import styles from './Dashboard.module.css';

export default function DashboardClient() {
  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <header className={styles.menuBar}>
        <button
          className={styles.navButton}
          onClick={() => location.href = '/api/auth/signout'}
        >
          ログアウト
        </button>
        <button
          className={styles.navButton}
          onClick={() => {
            // レーティング計算処理（API呼び出しなどに置き換え可能）
            console.log('レーティング計算実行');
          }}
        >
          レーティング計算
        </button>
      </header>

      {/* メインコンテンツ */}
      <main className={styles.main}>
        <h1 className={styles.title}>トップメニュー</h1>
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={() => location.href = '/admin'}>
            管理者管理
          </button>
          <button className={styles.button} onClick={() => location.href = '/player'}>
            対局者管理
          </button>
          <button className={styles.button} onClick={() => location.href = '/result'}>
            対局結果管理
          </button>
        </div>
      </main>
    </div>
  );
}