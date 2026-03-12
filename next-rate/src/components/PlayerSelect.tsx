import { default as Select, StylesConfig, ControlProps, OptionProps, CSSObjectWithLabel } from 'react-select';
export type PlayerOption = { value: string; label: string };

type Props = {
  value: PlayerOption | null;
  onChange: (opt: PlayerOption | null) => void;
  options: PlayerOption[];
  placeholder?: string;
  width?: string | number;
};

export default function PlayerSelect({ value, onChange, options, placeholder, width = 260 }: Props) {
  const customStyles: StylesConfig<PlayerOption, false> = {
    control: (base: CSSObjectWithLabel, state: ControlProps<PlayerOption, false>) => ({
      ...base,
      minHeight: 42,
      height: 42,
      borderRadius: 6,
      borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
      boxShadow: state.isFocused ? '0 0 0 3px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)' : 'none',
      backgroundColor: 'var(--color-bg-surface)',
      width,
    }),
    valueContainer: (base: CSSObjectWithLabel) => ({ ...base, height: 42, padding: '0 12px' }),
    singleValue: (base: CSSObjectWithLabel) => ({ ...base, color: 'var(--color-text-main)' }),
    input: (base: CSSObjectWithLabel) => ({ ...base, color: 'var(--color-text-main)' }),
    menu: (base: CSSObjectWithLabel) => ({ ...base, borderRadius: 6, border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999, backgroundColor: 'var(--color-bg-surface)' }),
    option: (base: CSSObjectWithLabel, state: OptionProps<PlayerOption, false>) => ({
      ...base,
      color: 'var(--color-text-main)',
      backgroundColor: state.isFocused ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
      cursor: 'pointer',
    }),
    placeholder: (base: CSSObjectWithLabel) => ({ ...base, color: 'var(--color-text-muted)' }),
  };

  return (
    <Select<PlayerOption>
      options={options}
      value={value}
      onChange={opt => onChange(opt as PlayerOption)}
      placeholder={placeholder}
      isClearable
      styles={customStyles}
      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
    />
  );
}