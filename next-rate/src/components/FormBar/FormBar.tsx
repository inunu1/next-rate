"use client";

import React from "react";
import styles from "./FormBar.module.css";
import type { FormBarProps } from "@/types/ui";

/**
 * FormBar コンポーネント
 * - フォームや入力欄をまとめて表示するバー
 * - open=false の場合は折りたたみ状態で表示
 * - as="form" の場合は <form> タグを使用
 * - as="div" の場合は <div> タグを使用
 */
export default function FormBar(props: FormBarProps) {
  const {
    as = "div", // デフォルトは div
    children,
    open = true,
  } = props;

  /**
   * 開閉状態に応じてクラス名を切り替える
   * - collapsed クラスが付くと高さが縮む（CSS 側で制御）
   */
  const innerClassName = [
    styles.formBarInner,
    !open ? styles.collapsed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.formBarContainer}>
      <div className={innerClassName}>
        {as === "form" ? (
          /**
           * フォームとして利用する場合
           * - onSubmit は FormProps の場合のみ存在
           */
          <form className={styles.formBar} onSubmit={props.onSubmit}>
            {children}
          </form>
        ) : (
          /**
           * 通常の div として利用する場合
           */
          <div className={styles.formBar}>{children}</div>
        )}
      </div>
    </div>
  );
}
