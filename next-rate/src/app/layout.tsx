// ------------------------------------------------------------
//  layout.tsx
//  アプリケーション全体のレイアウト定義
//  - フォント設定
//  - グローバルスタイル適用
//  - トースト通知（sonner）Provider 設置
// ------------------------------------------------------------

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner"; // ← トースト通知ライブラリ
import "./globals.css";

// ------------------------------------------------------------
//  Google Fonts（Geist）設定
// ------------------------------------------------------------
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ------------------------------------------------------------
//  メタデータ設定
// ------------------------------------------------------------
export const metadata: Metadata = {
  title: "Next Rate",
  description: "A Shogi rating management system",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

// ------------------------------------------------------------
//  ルートレイアウト
//  - 全ページ共通の HTML 構造
//  - トースト通知 Toaster を配置
// ------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* ページコンテンツ */}
        {children}

        {/* ------------------------------------------------------------
            トースト通知（sonner）
            - richColors: 成功/失敗の色を強調
            - closeButton: 閉じるボタンを表示
           ------------------------------------------------------------ */}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
