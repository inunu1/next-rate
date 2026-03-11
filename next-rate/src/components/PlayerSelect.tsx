'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

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

  const openDropdown = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setOpen(true);
  };

  return (
    <>
      <div ref={ref} style={{ width: '260px' }}>
        <input
          placeholder={placeholder}
          value={open ? query : value?.label ?? ''}
          onChange={(e) => {
            setQuery(e.target.value);
            openDropdown();
          }}
          onFocus={openDropdown}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-main)',
          }}
        />
      </div>

      {open &&
        createPortal(
                    <ul
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: '220px',
              overflowY: 'auto',
              background: 'var(--color-bg-surface)',        // ★ 入力欄と統一
              border: '1px solid #4b5563',                  // ★ ダークテーマ向け
              borderRadius: '6px',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',      // ★ ダークテーマ向け
            }}
          >
            {filtered.map((opt, i) => {
              const isHover = hoverIndex === i;

              return (
                <li
                  key={opt.value}
                  onMouseDown={() => {
                    onChange(opt);
                    setQuery('');
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',                 // ★ 入力欄と統一
                    background: isHover
                      ? 'var(--color-bg-hover)'                     // ★ hover も統一
                      : 'var(--color-bg-surface)',                  // ★ 入力欄と統一
                  }}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}