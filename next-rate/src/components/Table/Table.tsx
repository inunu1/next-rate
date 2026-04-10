'use client';

import { ReactNode } from 'react';
import styles from './Table.module.css';

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  className?: string;
};

export default function Table<T>({ columns, rows, className }: Props<T>) {
  return (
    <table className={`${styles.table}${className ? ' ' + className : ''}`}>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx}>{col.header}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col, idx) => (
              <td key={idx}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
