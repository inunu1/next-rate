'use client';

import { ReactNode } from 'react';
import styles from './PageHeader.module.css';

type Props = {
  title: ReactNode;
  actions?: ReactNode;
};

export default function PageHeader({ title, actions }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>{title}</div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
