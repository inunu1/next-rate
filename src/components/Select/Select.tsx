"use client";

import React, { useEffect, useState } from "react";
import SelectBase from "react-select";
import CreatableSelect from "react-select/creatable";
import styles from "./Select.module.css";

/**
 * セレクトボックスの選択肢定義
 * - value: 内部値
 * - label: 表示名
 * - __isNew__: CreatableSelect で新規作成された場合に付与されるフラグ
 */
export interface Option {
  value: string;
  label: string;
  __isNew__?: boolean;
}

/**
 * Select コンポーネントのプロパティ定義
 * - value: 現在の選択値
 * - onChange: 選択変更時のコールバック
 * - options: 選択肢一覧
 * - placeholder: プレースホルダー
 * - width: セレクトボックスの幅（PC 時のみ適用）
 * - mode: 通常 select か creatable select か
 * - searchable: 検索可能かどうか
 */
export interface SelectProps {
  value: Option | null;
  onChange: (opt: Option | null) => void;
  options: Option[];
  placeholder?: string;
  width?: string | number;
  mode?: "select" | "creatable";
  searchable?: boolean;
}

/**
 * Select コンポーネント
 * ---------------------------------------------------------
 * react-select をラップしたアプリ共通のセレクト UI。
 * - PC：指定された width を使用
 * - スマホ：幅を 100% に強制
 * - mode により通常 select / creatable select を切り替え
 * ---------------------------------------------------------
 */
export default function Select(props: SelectProps) {
  const {
    value,
    onChange,
    options,
    placeholder,
    width = 260,
    mode = "select",
    searchable = true,
  } = props;

  /**
   * 使用するコンポーネントを mode に応じて切り替える
   */
  const Component = mode === "creatable" ? CreatableSelect : SelectBase;

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
   * セレクトボックスの幅を決定
   * - スマホ：100%
   * - PC：props.width を使用
   */
  const containerWidth = isMobile ? "100%" : width;

  /**
   * react-select の onChange は型が広いため、
   * Option 型にキャストしてから渡す。
   */
  const handleChange = (opt: unknown) => {
    onChange(opt as Option);
  };

  return (
    <Component
      /**
       * wrapper 用のクラス名
       */
      className={styles.wrapper}
      classNamePrefix="sel"
      classNames={{
        control: () => styles.control,
        menu: () => styles.menu,
        option: (state) =>
          state.isFocused ? styles.optionFocused : styles.option,
        singleValue: () => styles.singleValue,
        placeholder: () => styles.placeholder,
        valueContainer: () => styles.valueContainer,
        input: () => styles.input,
      }}
      /**
       * インラインスタイルで幅を制御
       */
      styles={{
        container: (base) => ({
          ...base,
          width: containerWidth,
        }),
      }}
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable
      isSearchable={searchable}
      /**
       * メニューを body 直下に描画（モーダルや overflow 隠し対策）
       */
      menuPortalTarget={
        typeof window !== "undefined" ? document.body : undefined
      }
      menuPosition="fixed"
    />
  );
}
