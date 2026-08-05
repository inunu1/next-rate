"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import styles from "./ManagementPanel.module.css";

export type ManagementPanelContent = ReactElement | null;
export type ManagementPanelChildren =
  | ManagementPanelContent
  | ManagementPanelContent[];

export interface ManagementPanelProps {
  title: string;
  action?: {
    href: string;
    label: string;
    className?: string;
  };
  activeTab: "search" | "register";
  onTabChange: (tab: "search" | "register") => void;
  isFormOpen: boolean;
  onToggleOpen: () => void;
  searchContent: ManagementPanelContent;
  registerContent: ManagementPanelContent;
  children?: ManagementPanelChildren;
}

export default function ManagementPanel(props: ManagementPanelProps) {
  const {
    title,
    action,
    activeTab,
    onTabChange,
    isFormOpen,
    onToggleOpen,
    searchContent,
    registerContent,
    children,
  } = props;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>{title}</div>
        {action ? (
          <div className={styles.actions}>
            <Link href={action.href} className={action.className}>
              {action.label}
            </Link>
          </div>
        ) : null}
      </header>

      <div className={styles.formCard}>
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "search" && isFormOpen ? styles.tabActive : ""}`}
            onClick={() => onTabChange("search")}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "register" && isFormOpen ? styles.tabActive : ""}`}
            onClick={() => onTabChange("register")}
          >
            ✍️ 新規登録
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${!isFormOpen ? styles.tabActive : ""}`}
            onClick={onToggleOpen}
          >
            ✖️ 閉じる
          </button>
        </div>

        {activeTab === "search" && isFormOpen ? searchContent : null}
        {activeTab === "register" && isFormOpen ? registerContent : null}
      </div>

      {children}
    </div>
  );
}

export function ManagementTable({ children }: { children: ManagementPanelContent }) {
  return (
    <main className={styles.main}>
      <div className={styles.tableWrapper}>{children}</div>
    </main>
  );
}
