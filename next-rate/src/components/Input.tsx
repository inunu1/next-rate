import { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  width?: string | number;
};

export default function Input({ className, width, style, ...props }: Props) {
  // width が指定されていればインラインスタイルで適用し、指定がなければ親要素などから決まる自動幅にする
  const customStyle = { ...style, ...(width ? { width } : {}) };

  return (
      <input
          className={`${styles.input} ${className || ''}`}
          style={customStyle}
          {...props}
      />
  );
}
