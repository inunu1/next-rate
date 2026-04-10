'use client';

import { ReactNode } from "react";
import styles from "./FormBar.module.css";

/* ① as="form" のときだけ onSubmit を許可 */
type FormProps = {
  as: "form";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

/* ② as="div" のときは onSubmit を禁止 */
type DivProps = {
  as?: "div";
  onSubmit?: never;
  children: ReactNode;
};

type Props = FormProps | DivProps;

export default function FormBar({ as = "div", onSubmit, children }: Props) {
  const Component = as;

  return (
    <Component className={styles.formBar} onSubmit={onSubmit as any}>
      {children}
    </Component>
  );
}
