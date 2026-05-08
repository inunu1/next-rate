'use client';

import { ReactNode, useEffect, useState } from 'react';
import styles from './Table.module.css';

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string; // モバイルカードでのラベル
  hideOnMobile?: boolean; // モバイルで非表示
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  className?: string;
};

export default function Table<T>({ columns, rows, className }: Props<T>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // モバイル：カードレイアウト
    return (
      <div className={`${styles.mobileCards}${className ? ' ' + className : ''}`}>
        {rows.map((row, i) => (
          <div key={i} className={styles.card}>
            {columns
              .filter(col => !col.hideOnMobile)
              .map((col, idx) => (
                <div key={idx} className={styles.cardRow}>
                  <span className={styles.cardLabel}>
                    {col.mobileLabel || col.header}:
                  </span>
                  <span className={styles.cardValue}>
                    {col.render(row)}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // デスクトップ：通常のテーブル
  return (
    <table className={`${styles.table}${className ? ' ' + className : ''}`}>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx}>{col.header}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col, idx) => (
              <td key={idx}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
