"use client";

import React, { ReactNode } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import Tabs from "@/components/Tabs/Tabs";
import styles from "./ManagementPanel.module.css";

export interface ManagementPanelProps {
  title: string;
  actions?: ReactNode;
  activeTab: "search" | "register";
  onTabChange: (tab: "search" | "register") => void;
  isFormOpen: boolean;
  onToggleOpen: () => void;
  searchContent: ReactNode;
  registerContent: ReactNode;
  children?: ReactNode;
}

export default function ManagementPanel(props: ManagementPanelProps) {
  const {
    title,
    actions,
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
      <PageHeader title={title} actions={actions} />

      <div className={styles.formCard}>
        <Tabs
          tabs={[
            {
              id: "search",
              label: "🔍 検索",
              active: activeTab === "search" && isFormOpen,
              onClick: () => onTabChange("search"),
            },
            {
              id: "register",
              label: "✍️ 新規登録",
              active: activeTab === "register" && isFormOpen,
              onClick: () => onTabChange("register"),
            },
          ]}
          closeButton={{
            label: "✖️ 閉じる",
            active: !isFormOpen,
            onClick: onToggleOpen,
          }}
        />

        {activeTab === "search" && isFormOpen ? searchContent : null}
        {activeTab === "register" && isFormOpen ? registerContent : null}
      </div>

      {children}
    </div>
  );
}

export function ManagementTable({ children }: { children: ReactNode }) {
  return (
    <main className={styles.main}>
      <div className={styles.tableWrapper}>{children}</div>
    </main>
  );
}
