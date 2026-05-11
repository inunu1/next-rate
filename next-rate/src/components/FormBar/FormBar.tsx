'use client';

import { ReactNode } from "react";
import styles from "./FormBar.module.css";

type BaseProps = {
  children: ReactNode;
  open?: boolean;
};

type FormProps = BaseProps & {
  as: "form";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

type DivProps = BaseProps & {
  as?: "div";
  onSubmit?: never;
};

type Props = FormProps | DivProps;

export default function FormBar(props: Props) {
  const { as = "div", children, open = true } = props;

  return (
    <div className={styles.formBarContainer}>
      <div className={`${styles.formBarInner} ${!open ? styles.collapsed : ""}`}>
        {as === "form" ? (
          <form className={styles.formBar} onSubmit={props.onSubmit}>
            {children}
          </form>
        ) : (
          <div className={styles.formBar}>{children}</div>
        )}
      </div>
    </div>
  );
}
