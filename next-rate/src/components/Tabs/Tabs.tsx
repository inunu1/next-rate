"use client";

import React, { ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: ReactNode;
  active: boolean;
  onClick: () => void;
}

export interface CloseButton {
  label: ReactNode;
  active: boolean;
  onClick: () => void;
}

export interface TabsProps {
  tabs: TabItem[];
  closeButton?: CloseButton;
}

export default function Tabs({ tabs, closeButton }: TabsProps) {
  return (
    <div className={styles.tabContainer}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${styles.tabButton} ${tab.active ? styles.tabActive : ""}`}
          onClick={tab.onClick}
        >
          {tab.label}
        </button>
      ))}

      {closeButton ? (
        <button
          type="button"
          className={`${styles.tabButton} ${closeButton.active ? styles.tabActive : ""}`}
          onClick={closeButton.onClick}
        >
          {closeButton.label}
        </button>
      ) : null}
    </div>
  );
}
