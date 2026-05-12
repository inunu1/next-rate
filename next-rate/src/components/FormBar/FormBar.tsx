"use client";

import React, { ReactNode } from "react";
import styles from "./FormBar.module.css";

/**
 * FormBar の基本プロパティ
 * - children: 内部に配置する要素
 * - open: 開閉状態（true: 開く / false: 閉じる）
 */
export interface BaseProps {
  children: ReactNode;
  open?: boolean;
}

/**
 * form として利用する場合のプロパティ
 * - as: "form" を指定
 * - onSubmit: フォーム送信時のイベントハンドラ
 */
export interface FormProps extends BaseProps {
  as: "form";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * div として利用する場合のプロパティ
 * - as: "div"（省略時も div 扱い）
 * - onSubmit は使用不可
 */
export interface DivProps extends BaseProps {
  as?: "div";
  onSubmit?: never;
}

/**
 * FormBar コンポーネントのプロパティ型
 * - form として使うか div として使うかをユニオン型で表現
 */
export type FormBarProps = FormProps | DivProps;

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
