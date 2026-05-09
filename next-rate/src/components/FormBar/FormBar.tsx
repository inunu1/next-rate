'use client';

import { ReactNode, useState } from "react";
import styles from "./FormBar.module.css";

type FormProps = {
  as: "form";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

type DivProps = {
  as?: "div";
  onSubmit?: never;
  children: ReactNode;
};

type Props = FormProps | DivProps;

export default function FormBar(props: Props) {
  const [open, setOpen] = useState(true);
  const { as = "div", children } = props;

  return (
    <div className={styles.formBarContainer}>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "フォームを閉じる" : "フォームを開く"}
      </button>

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
