'use client';

import styles from '@/styles/DashboardClient.module.css';

export default function DashboardClient() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.buttonGroup}>
        <button className={styles.button} onClick={() => location.href = '/admin'}>Admin</button>
        <button className={styles.button} onClick={() => location.href = '/player'}>Player</button>
        <button className={styles.button} onClick={() => location.href = '/result'}>Result</button>
      </div>
    </div>
  );
}