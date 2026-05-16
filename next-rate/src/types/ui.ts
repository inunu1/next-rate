import { ReactNode } from "react";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

export interface DataGridProps<T> {
  columns: Column<T>[];
  rows: T[];
  className?: string;
}

export interface Option {
  value: string;
  label: string;
  __isNew__?: boolean;
}

export interface SelectProps {
  value: Option | null;
  onChange: (opt: Option | null) => void;
  options: Option[];
  placeholder?: string;
  width?: string | number;
  mode?: "select" | "creatable";
  searchable?: boolean;
}

export interface BaseProps {
  children: ReactNode;
  open?: boolean;
}

export interface FormProps extends BaseProps {
  as: "form";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export interface DivProps extends BaseProps {
  as?: "div";
  onSubmit?: never;
}

export type FormBarProps = FormProps | DivProps;
