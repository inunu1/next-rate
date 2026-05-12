"use client";

import React, { ReactNode } from "react";
import styles from "./PageHeader.module.css";

/**
 * PageHeader コンポーネントのプロパティ定義
 * - title: 画面タイトル（文字列 or ReactNode）
 * - actions: 右側に配置する操作ボタン群（任意）
 */
export interface PageHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
}

/**
 * PageHeader コンポーネント
 * ---------------------------------------------------------
 * 画面上部にタイトルとアクションボタンを配置するための共通ヘッダー。
 * - 左側：タイトル
 * - 右側：アクション（任意）
 * - レイアウトは CSS 側で制御（flex）
 * ---------------------------------------------------------
 */
export default function PageHeader(props: PageHeaderProps) {
  const { title, actions } = props;

  /**
   * actions が存在する場合のみ右側に表示する。
   * 存在しない場合は null を返し、余計な DOM を生成しない。
   */
  const actionsElement = actions ? (
    <div className={styles.actions}>{actions}</div>
  ) : null;

  return (
    <header className={styles.header}>
      {/* タイトル部分 */}
      <div className={styles.title}>{title}</div>

      {/* アクション部分（任意） */}
      {actionsElement}
    </header>
  );
}
