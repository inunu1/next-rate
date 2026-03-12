'use client';

import Select, {
  StylesConfig,
  ControlProps,
  OptionProps,
  CSSObjectWithLabel,
} from 'react-select';
import CreatableSelect from 'react-select/creatable';

export type PlayerOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

type Props = {
  value: PlayerOption | null;
  onChange: (opt: PlayerOption | null) => void;
  options: PlayerOption[];
  placeholder?: string;
  width?: string | number;
  mode?: 'select' | 'creatable'; // ★ 追加
};

export default function PlayerSelect({
  value,
  onChange,
  options,
  placeholder,
  width = 260,
  mode = 'select', // ★ デフォルトは既存のみ
}: Props) {
  const customStyles: StylesConfig<PlayerOption, false> = {
    control: (base: CSSObjectWithLabel, state: ControlProps<PlayerOption, false>) => ({
      ...base,
      minHeight: 42,
      height: 42,
      borderRadius: 6,
      borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
      boxShadow: state.isFocused
        ? '0 0 0 3px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)'
        : 'none',
      backgroundColor: 'var(--color-bg-surface)',
      width,
    }),
    valueContainer: (base) => ({ ...base, height: 42, padding: '0 12px' }),
    singleValue: (base) => ({ ...base, color: 'var(--color-text-main)' }),
    input: (base) => ({ ...base, color: 'var(--color-text-main)' }),
    menu: (base) => ({
      ...base,
      borderRadius: 6,
      border: '1px solid var(--color-border)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      backgroundColor: 'var(--color-bg-surface)',
    }),
    option: (base, state) => ({
      ...base,
      color: 'var(--color-text-main)',
      backgroundColor: state.isFocused ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
      cursor: 'pointer',
    }),
    placeholder: (base) => ({ ...base, color: 'var(--color-text-muted)' }),
  };

  // ★ Creatable と Select を切り替える
  const Component = mode === 'creatable' ? CreatableSelect : Select;

  return (
    <Component
      options={options}
      value={value}
      onChange={(opt) => onChange(opt as PlayerOption)}
      placeholder={placeholder}
      isClearable
      styles={customStyles}
      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
    />
  );
}