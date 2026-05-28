"use client";

import React, {
  InputHTMLAttributes,
  useEffect,
  useState,
  CSSProperties,
} from "react";
import styles from "./DateInput.module.css";

/**
 * DateInput コンポーネントのプロパティ定義
 * - width: 入力欄の横幅（任意）
 * - wrapperClassName: ラッパー要素に付与するクラス名（任意）
 * - その他の属性は input[type="date"] にそのまま渡す
 */
export interface DateInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  width?: string | number;
  wrapperClassName?: string;
}

/**
 * 日付入力コンポーネント
 * - スマートフォン時は幅を 100% に強制
 * - PC 時は width プロパティを優先
 * - ラッパー div を用意し、外側のレイアウト調整を容易にする
 */
export default function DateInput(props: DateInputProps) {
  const {
    className,
    wrapperClassName,
    width,
    style,
    ...rest
  } = props;

  /**
   * スマートフォン判定用ステート
   * - 初回レンダリング時とリサイズ時に更新
   */
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    /**
     * 現在の画面幅からスマホ判定を行う
     */
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 初期判定
    checkIsMobile();

    // リサイズイベント登録
    window.addEventListener("resize", checkIsMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  /**
   * インラインスタイルの組み立て
   * - スマホ時：幅を 100% に固定
   * - PC 時：width プロパティがあれば適用
   * - style が指定されていればマージ
   */
  const computedStyle: CSSProperties = {
    ...style,
    ...(isMobile
      ? { width: "100%" }
      : width
      ? { width }
      : {}),
  };

  /**
   * ラッパー要素のクラス名組み立て
   */
  const wrapperClass = [
    styles.dateInputWrapper,
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * input 要素のクラス名組み立て
   */
  const inputClass = [
    styles.dateInput,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <input
        type="date"
        className={inputClass}
        style={computedStyle}
        {...rest}
      />
    </div>
  );
}
