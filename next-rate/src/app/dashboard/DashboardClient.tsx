'use client';

import styles from './Dashboard.module.css';
import MenuBar from '@/components/MenuBar';

export default function DashboardClient() {
  return (
    <div className={styles.container}>
      {/* メニューバー */}
      <MenuBar
        title="メニュー"
        actions={[{ label: 'ログアウト', href: '/api/auth/signout' }]}
        styles={{
          menuBar: styles.menuBar,
          title: styles.menuTitle,
          nav: styles.menuActions,
          actionButton: styles.navButton,
        }}
      />

      {/* メインコンテンツ */}
      <main className={styles.main}>
        <div className={styles.grid}>
          <button
            className={styles.gridButton}
            onClick={() => (location.href = '/admin')}
          >
            管理者管理
          </button>
          <button
            className={styles.gridButton}
            onClick={() => (location.href = '/players')}
          >
            対局者管理
          </button>
          <button
            className={styles.gridButton}
            onClick={() => (location.href = '/results')}
          >
            対局結果管理
          </button>
        </div>
      </main>
    </div>
  );
}