"use client";

import React, { ReactNode, useEffect, useState } from "react";
import styles from "./Table.module.css";

/**
 * テーブル列定義
 * - header: 列名（デスクトップ表示）
 * - render: 行データからセル内容を生成する関数
 * - mobileLabel: モバイルカード表示時のラベル（任意）
 * - hideOnMobile: モバイル時に非表示にする列（任意）
 */
export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

/**
 * Table コンポーネントのプロパティ定義
 * - columns: 列定義
 * - rows: 行データ
 * - className: 追加クラス名（任意）
 */
export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  className?: string;
}

/**
 * Table コンポーネント
 * ---------------------------------------------------------
 * デスクトップ：通常の <table> レイアウト
 * モバイル：カード型レイアウトに自動切り替え
 * ---------------------------------------------------------
 */
export default function Table<T>(props: TableProps<T>) {
  const { columns, rows, className } = props;

  /**
   * スマートフォン判定用ステート
   * - 初回レンダリング時とリサイズ時に更新
   */
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    /**
     * 現在の画面幅からスマホ判定を行う
     */
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 初期判定
    checkMobile();

    // リサイズイベント登録
    window.addEventListener("resize", checkMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  /**
   * モバイル表示の場合：カードレイアウトを返す
   */
  if (isMobile) {
    const wrapperClass = [
      styles.mobileCards,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClass}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.card}>
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col, colIndex) => (
                <div key={colIndex} className={styles.cardRow}>
                  {/* ラベル部分（mobileLabel があれば優先） */}
                  <span className={styles.cardLabel}>
                    {col.mobileLabel || col.header}:
                  </span>

                  {/* 値部分 */}
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

  /**
   * デスクトップ表示の場合：通常のテーブルを返す
   */
  const tableClass = [
    styles.table,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <table className={tableClass}>
      <thead>
        <tr>
          {columns.map((col, colIndex) => (
            <th key={colIndex}>{col.header}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <td key={colIndex}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
