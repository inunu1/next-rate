'use client';

import Link from 'next/link';
import styles from './Dashboard.module.css';

export default function DashboardClient() {
  return (
    <div className={styles.container}>
      {/* Header Area */}
      <header className={styles.header}>
        <div className={styles.title}>next-rate</div>
        <Link href="/api/auth/signout" className={styles.logoutButton}>
          ログアウト
        </Link>
      </header>

      <main className={styles.main}>
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Dashboard</h1>
          <p className={styles.welcomeSubtitle}>管理メニューを選択してください</p>
        </section>

        {/* Navigation Grid */}
        <div className={styles.grid}>
          <Link href="/admin" className={styles.card}>
            <div className={styles.cardIcon}>⚙️</div>
            <div className={styles.cardTitle}>管理者管理</div>
            <div className={styles.cardDescription}>
              システム管理者の追加・編集・削除を行います。
            </div>
          </Link>

          <Link href="/players" className={styles.card}>
            <div className={styles.cardIcon}>👥</div>
            <div className={styles.cardTitle}>対局者管理</div>
            <div className={styles.cardDescription}>
              プレイヤーの登録情報やレートを確認します。
            </div>
          </Link>

          <Link href="/results" className={styles.card}>
            <div className={styles.cardIcon}>📊</div>
            <div className={styles.cardTitle}>対局結果管理</div>
            <div className={styles.cardDescription}>
              対戦履歴の閲覧と、結果の修正・削除を行います。
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}