import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next Rate",
  description: "対局結果とレート管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body
        className={`h-full overflow-hidden ${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <div className="h-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}