'use client';

import { useEffect, useState } from "react";
import SelectBase from "react-select";
import CreatableSelect from "react-select/creatable";
import styles from "./Select.module.css";

export type Option = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

type Props = {
  value: Option | null;
  onChange: (opt: Option | null) => void;
  options: Option[];
  placeholder?: string;
  width?: string | number;
  mode?: "select" | "creatable";
  searchable?: boolean;
};

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  width = 260,
  mode = "select",
  searchable = true,
}: Props) {
  const Component = mode === "creatable" ? CreatableSelect : SelectBase;

  // スマートフォンサイズ判定
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 初期判定
    setIsMobile(window.innerWidth <= 768);

    // リサイズイベントリスナー
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // スマートフォンサイズでは100%、そうでなければwidth propsを使用
  const containerWidth = isMobile ? "100%" : width;

  return (
    <Component
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
      styles={{
        container: (base) => ({
          ...base,
          width: containerWidth,
        }),
      }}
      options={options}
      value={value}
      onChange={(opt) => onChange(opt as Option)}
      placeholder={placeholder}
      isClearable
      isSearchable={searchable}
      menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
      menuPosition="fixed"
    />
  );
}
