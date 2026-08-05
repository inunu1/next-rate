"use client";

import Link from "next/link";
import styles from "./PageHeader.module.css";

/**
 * PageHeader コンポーネントのプロパティ定義
 * - title: 画面タイトル
 * - action: 右側に配置するリンク（任意）
 */
export interface PageHeaderProps {
  title: string;
  action?: {
    href: string;
    label: string;
    className?: string;
  };
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
  const { title, action } = props;

  /**
   * action が存在する場合のみ右側に表示する。
   * 存在しない場合は null を返し、余計な DOM を生成しない。
   */
  const actionElement = action ? (
    <div className={styles.actions}>
      <Link href={action.href} className={action.className}>
        {action.label}
      </Link>
    </div>
  ) : null;

  return (
    <header className={styles.header}>
      {/* タイトル部分 */}
      <div className={styles.title}>{title}</div>

      {/* アクション部分（任意） */}
      {actionElement}
    </header>
  );
}
