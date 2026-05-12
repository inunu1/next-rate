"use client";

import React, { ReactNode } from "react";
import styles from "./Table.module.css";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  className?: string;
}

/**
 * Table（カードレイアウト統一版）
 * - PC / モバイル問わずカード形式で表示
 * - レイアウト差異がなくなるためコードが大幅に簡略化
 */
export default function Table<T>({ columns, rows, className }: TableProps<T>) {
  const wrapperClass = [
    styles.mobileCards,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={wrapperClass}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.card}>
          {columns
            .filter(col => !col.hideOnMobile)
            .map((col, colIndex) => (
              <div key={colIndex} className={styles.cardRow}>
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
