"use client";

/**
 * ============================================================================
 * 【画面名称】
 * ダッシュボード画面（DashboardClient）
 *
 * 【機能概要】
 * ・ログインユーザーのロール（owner / admin）に応じて
 *   表示するメニューを切り替える。
 *
 * 【設計方針】
 * ① admin（団体オーナー）
 *      - 自団体の管理のみ可能
 *      - 表示メニュー：ユーザー管理 / 対局者管理 / 対局結果管理
 *      - User 管理は自団体のユーザー追加が可能（UI は owner と一部共通）
 *
 * ② owner（SaaS 運営者）
 *      - 複数団体を管理可能
 *      - 表示メニュー：User 管理 / 対局者管理 / 対局結果管理
 *
 * ③ Server Component（page.tsx）から role を受け取り、
 *    本コンポーネントで UI を出し分ける。
 *
 * 【非責務】
 * ・認証チェック（Server Component 側で実施）
 * ・DB アクセス（API に集約）
 * ============================================================================
 */

import Link from "next/link";
import styles from "./Dashboard.module.css";
import PageHeader from "@/components/PageHeader/PageHeader";

export default function DashboardClient({
  role,
}: {
  role: "owner" | "admin" | "editer" | "viewer";
}) {
  return (
    <div className={styles.container}>
      {/* ----------------------------------------------------------------------
       * 画面ヘッダ
       * -------------------------------------------------------------------- */}
      <PageHeader
        title="next-rate"
        actions={
          <Link href="/api/auth/signout" className={styles.logoutButton}>
            ログアウト
          </Link>
        }
      />

      <main className={styles.main}>
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Dashboard</h1>
          <p className={styles.welcomeSubtitle}>管理メニューを選択してください</p>
        </section>

        {/* ----------------------------------------------------------------------
         * メニューグリッド（ロール別に表示内容を切り替える）
         * -------------------------------------------------------------------- */}
        <div className={styles.grid}>
          {/* owner / admin：ユーザー管理（admin は自団体のみ操作可） */}
          {(role === "owner" || role === "admin") && (
            <Link href="/user" className={styles.card}>
              <div className={styles.cardIcon}>👤</div>
              <div className={styles.cardTitle}>ユーザー管理</div>
              <div className={styles.cardDescription}>
                ユーザーの追加・編集・削除を行います。
              </div>
            </Link>
          )}

          {/* owner のみ表示：団体管理 */}
          {role === "owner" && (
            <Link href="/organization" className={styles.card}>
              <div className={styles.cardIcon}>⚙️</div>
              <div className={styles.cardTitle}>団体管理</div>
              <div className={styles.cardDescription}>
                団体の追加・削除を行います。
              </div>
            </Link>
          )}

          {/* 対局者管理（全ユーザーに表示。閲覧者は編集操作を UI 側で制限） */}
          <Link href="/players" className={styles.card}>
            <div className={styles.cardIcon}>👥</div>
            <div className={styles.cardTitle}>対局者管理</div>
            <div className={styles.cardDescription}>
              プレイヤーの登録情報やレートを確認します。
            </div>
          </Link>

          {/* 対局結果管理（全ユーザーに表示。閲覧者は編集操作を UI 側で制限） */}
          <Link href="/results" className={styles.card}>
            <div className={styles.cardIcon}>📊</div>
            <div className={styles.cardTitle}>対局結果管理</div>
            <div className={styles.cardDescription}>
              対戦履歴の閲覧と、結果の登録・削除を行います。
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
