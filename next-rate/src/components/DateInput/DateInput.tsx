'use client';

import { InputHTMLAttributes, useEffect, useState } from 'react';
import styles from './DateInput.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  width?: string | number;
  wrapperClassName?: string;
};

export default function DateInput({
  className,
  wrapperClassName,
  width,
  style,
  ...props
}: Props) {
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

  // width が指定されていればインラインスタイルで適用
  // スマートフォンサイズでは100%を強制
  const customStyle = {
    ...style,
    ...(isMobile ? { width: "100%" } : width ? { width } : {}),
  };

  return (
    <div
      className={`${styles.dateInputWrapper}${
        wrapperClassName ? ' ' + wrapperClassName : ''
      }`}
    >
      <input
        type="date"
        className={`${styles.dateInput}${className ? ' ' + className : ''}`}
        style={customStyle}
        {...props}
      />
    </div>
  );
}
