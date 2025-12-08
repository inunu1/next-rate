'use client';

type MenuBarProps = {
  title: string;
  actions?: { label: string; href: string }[];
  styles: {
    menuBar: string;
    title: string;
    nav?: string;
    actionButton: string;
  };
};

export default function MenuBar({ title, actions = [], styles }: MenuBarProps) {
  return (
    <header className={styles.menuBar}>
      <h1 className={styles.title}>{title}</h1>
      <nav className={styles.nav}>
        {actions.map((action, idx) => (
          <button
            key={idx}
            className={styles.actionButton}
            onClick={() => (location.href = action.href)}
          >
            {action.label}
          </button>
        ))}
      </nav>
    </header>
  );
}