'use client';

import { useState } from 'react';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<'admin' | 'player' | 'result'>('admin');
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const closePopup = () => setActivePopup(null);

  return (
    <>
      {/* 🔝 メニューバー */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <h1 className={styles.logo}>管理システム</h1>
          <nav className={styles.nav}>
            <button onClick={() => setSelectedCategory('admin')} className={styles.navLink}>管理者管理</button>
            <button onClick={() => setSelectedCategory('player')} className={styles.navLink}>対局者管理</button>
            <button onClick={() => setSelectedCategory('result')} className={styles.navLink}>勝敗管理</button>
          </nav>
        </div>
      </header>

      {/* 📦 メインコンテンツ */}
      <main className={styles.main}>
        <h2 className={styles.title}>ダッシュボード</h2>

        {selectedCategory === 'admin' && (
          <div className={styles.grid}>
            <button onClick={() => setActivePopup('admin-add')} className={styles.buttonBlue}>管理者追加</button>
            <button onClick={() => setActivePopup('admin-search')} className={styles.buttonBlue}>管理者検索</button>
            <button onClick={() => setActivePopup('admin-edit')} className={styles.buttonBlue}>管理者編集</button>
            <button onClick={() => setActivePopup('admin-delete')} className={styles.buttonBlue}>管理者削除</button>
          </div>
        )}

        {selectedCategory === 'player' && (
          <div className={styles.grid}>
            <button onClick={() => setActivePopup('player-list')} className={styles.buttonBlue}>対局者一覧</button>
            <button onClick={() => setActivePopup('player-add')} className={styles.buttonBlue}>対局者追加</button>
            <button onClick={() => setActivePopup('player-edit')} className={styles.buttonBlue}>対局者編集</button>
            <button onClick={() => setActivePopup('player-delete')} className={styles.buttonBlue}>対局者削除</button>
          </div>
        )}

        {selectedCategory === 'result' && (
          <div className={styles.grid}>
            <button onClick={() => setActivePopup('result-record')} className={styles.buttonBlue}>勝敗記録</button>
            <button onClick={() => setActivePopup('result-search')} className={styles.buttonBlue}>勝敗検索</button>
            <button onClick={() => setActivePopup('result-edit')} className={styles.buttonBlue}>勝敗編集</button>
            <button onClick={() => setActivePopup('result-delete')} className={styles.buttonBlue}>勝敗削除</button>
          </div>
        )}

        {/* 🪟 ポップアップ表示 */}
        {activePopup && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>{popupTitle(activePopup)}</h3>
              <p>ここに「{popupTitle(activePopup)}」のフォームや操作を追加できます。</p>
              <button onClick={closePopup} className={styles.buttonYellow}>閉じる</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ポップアップタイトルを返す関数
function popupTitle(key: string): string {
  const titles: Record<string, string> = {
    'admin-add': '管理者追加',
    'admin-search': '管理者検索',
    'admin-edit': '管理者編集',
    'admin-delete': '管理者削除',
    'player-list': '対局者一覧',
    'player-add': '対局者追加',
    'player-edit': '対局者編集',
    'player-delete': '対局者削除',
    'result-record': '勝敗記録',
    'result-search': '勝敗検索',
    'result-edit': '勝敗編集',
    'result-delete': '勝敗削除',
  };
  return titles[key] || '操作';
}