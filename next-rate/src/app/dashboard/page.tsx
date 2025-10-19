'use client'; // Next.js のクライアントコンポーネント指定

import { useState } from 'react';
import styles from './Dashboard.module.css';

// ==============================
// 型定義
// ==============================

// カテゴリー（管理者・対局者・勝敗）
type Category = 'admin' | 'player' | 'result';

// ポップアップの種類（各操作に対応）
type PopupKey =
  | 'admin-add' | 'admin-search' | 'admin-edit' | 'admin-delete'
  | 'player-list' | 'player-add' | 'player-edit' | 'player-delete'
  | 'result-record' | 'result-search' | 'result-edit' | 'result-delete';

// ポップアップタイトル（日本語表示）
const popupTitles: Record<PopupKey, string> = {
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

// カテゴリーごとのボタン構成
const categoryButtons: Record<Category, PopupKey[]> = {
  admin: ['admin-add', 'admin-search', 'admin-edit', 'admin-delete'],
  player: ['player-list', 'player-add', 'player-edit', 'player-delete'],
  result: ['result-record', 'result-search', 'result-edit', 'result-delete'],
};

export default function DashboardPage() {
  // 現在選択されているカテゴリー（初期値: admin）
  const [selectedCategory, setSelectedCategory] = useState<Category>('admin');

  // 表示中のポップアップ（null なら非表示）
  const [activePopup, setActivePopup] = useState<PopupKey | null>(null);

  // ポップアップを閉じる関数
  const closePopup = () => setActivePopup(null);

  return (
    <>
      {/* 🔝 ナビゲーションバー */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <h1 className={styles.logo}>管理システム</h1>
          <nav className={styles.nav}>
            {/* カテゴリー切り替えボタン */}
            {(['admin', 'player', 'result'] as Category[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.navLink} ${selectedCategory === cat ? styles.active : ''}`}
              >
                {/* 最初のボタン名を「管理」に置換して表示 */}
                {popupTitles[categoryButtons[cat][0]].replace(/(追加|一覧|記録)/, '管理')}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 📦 メインコンテンツ */}
      <main className={styles.main}>
        <h2 className={styles.title}>ダッシュボード</h2>

        {/* 選択カテゴリーに応じた操作ボタン群 */}
        <div className={styles.grid}>
          {categoryButtons[selectedCategory].map((key) => (
            <button
              key={key}
              onClick={() => setActivePopup(key)}
              className={styles.buttonBlue}
            >
              {popupTitles[key]}
            </button>
          ))}
        </div>

        {/* 🪟 ポップアップ表示（activePopup がある場合） */}
        {activePopup && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>{popupTitles[activePopup]}</h3>
              <p>ここに「{popupTitles[activePopup]}」のフォームや操作を追加できます。</p>
              <button onClick={closePopup} className={styles.buttonYellow}>閉じる</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}