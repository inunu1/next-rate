'use client';

import { useState } from 'react';
import styles from './Dashboard.module.css';

// ==============================
// 型定義
// ==============================

// 操作キー（ポップアップが必要な機能のみ）
type PopupKey = 'logout' | 'rating';

// ポップアップタイトル（日本語表示）
const popupTitles: Record<PopupKey, string> = {
  logout: 'ログアウト',
  rating: 'レーティング計算',
};

export default function DashboardPage() {
  const [activePopup, setActivePopup] = useState<PopupKey | null>(null);

  const closePopup = () => setActivePopup(null);

  return (
    <>
      {/* 🔝 ナビゲーションバー */}
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <h1 className={styles.logo}>トップメニュー</h1>
        </div>
      </header>

      {/* 📦 メインコンテンツ */}
      <main className={styles.main}>
        <h2 className={styles.title}>機能選択</h2>

        <div className={styles.grid}>
          {/* 画面遷移系ボタン */}
          <button className={styles.buttonBlue} onClick={() => window.location.href = '/admin'}>
            管理者管理
          </button>
          <button className={styles.buttonBlue} onClick={() => window.location.href = '/player'}>
            対局者管理
          </button>
          <button className={styles.buttonBlue} onClick={() => window.location.href = '/result'}>
            対局結果管理
          </button>

          {/* 機能呼び出し系ボタン（ポップアップ表示） */}
          <button className={styles.buttonYellow} onClick={() => setActivePopup('logout')}>
            ログアウト
          </button>
          <button className={styles.buttonYellow} onClick={() => setActivePopup('rating')}>
            レーティング計算
          </button>
        </div>

        {/* 🪟 ポップアップ表示 */}
        {activePopup && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>{popupTitles[activePopup]}</h3>
              <p>ここに「{popupTitles[activePopup]}」の処理を実装してください。</p>
              <button onClick={closePopup} className={styles.buttonYellow}>閉じる</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}