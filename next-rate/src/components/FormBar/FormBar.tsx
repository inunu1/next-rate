'use client';

import { ReactNode } from "react";
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
  const { as = "div", children } = props;

  if (as === "form") {
    // form のときだけ onSubmit を渡す
    return (
      <form className={styles.formBar} onSubmit={props.onSubmit}>
        {children}
      </form>
    );
  }

  // div のときは onSubmit を渡さない
  return <div className={styles.formBar}>{children}</div>;
}
