'use client';

import { InputHTMLAttributes } from 'react';
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
  // width が指定されていればインラインスタイルで適用
  const customStyle = { ...style, ...(width ? { width } : {}) };

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
