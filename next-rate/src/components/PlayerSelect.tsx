'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './PlayerSelect.module.css';

export type PlayerOption = {
  value: string;
  label: string;
};

export default function PlayerSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: PlayerOption | null;
  onChange: (opt: PlayerOption | null) => void;
  options: PlayerOption[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered =
    query === ''
      ? options
      : options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        );

  // 外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      <input
        className={styles.input}
        placeholder={placeholder}
        value={open ? query : value?.label ?? ''}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <ul className={styles.list}>
          {filtered.map((opt) => (
            <li
              key={opt.value}
              className={styles.item}
              onMouseDown={() => {
                onChange(opt);
                setQuery('');
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}

          {filtered.length === 0 && (
            <li className={styles.noItem}>該当なし</li>
          )}
        </ul>
      )}
    </div>
  );
}