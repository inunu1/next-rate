"use client";

import React from "react";
import styles from "./DataGrid.module.css";
import type { Column, DataGridProps } from "@/types/ui";

/**
 * DataGrid（カードレイアウト統一版）
 * - PC / モバイル問わずカード形式で表示
 * - レイアウト差異がなくなるためコードが大幅に簡略化
 */
export default function DataGrid<T>({ columns, rows, className }: DataGridProps<T>) {
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
