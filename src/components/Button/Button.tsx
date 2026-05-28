"use client";

import React from "react";
import styles from "./Button.module.css";

/**
 * ボタンのバリアント種別
 * - primary: 主要操作
 * - secondary: 副次操作
 * - danger: 削除などの危険操作
 */
export type ButtonVariant = "primary" | "secondary" | "danger";

/**
 * ボタンのサイズ種別
 * - sm: 小
 * - md: 中
 * - lg: 大
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * ボタンコンポーネントのプロパティ定義
 * React.ButtonHTMLAttributes を継承しつつ、
 * variant / size を追加で定義する。
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * アプリ共通ボタンコンポーネント
 * - variant に応じて色やスタイルを切り替える
 * - size に応じてボタンサイズを切り替える
 * - className は任意で追加可能
 */
export default function AppButton(props: ButtonProps) {
  const {
    children,
    variant = "secondary",
    size = "md",
    className = "",
    ...rest
  } = props;

  /**
   * ボタンのクラス名を組み立てる
   * - styles.button は共通スタイル
   * - variant / size は動的にクラスを付与
   */
  const buttonClassName = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ].join(" ");

  return (
    <button className={buttonClassName} {...rest}>
      {children}
    </button>
  );
}
