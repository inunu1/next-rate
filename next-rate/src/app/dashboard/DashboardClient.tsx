"use client";

/**
 * ============================================================================
 * 【画面名称】
 * ダッシュボード画面（DashboardClient）
 *
 * 【機能概要】
 * ・ログインユーザーのロール（saasOwner / orgOwner）に応じて
 *   表示するメニューを切り替える。
 *
 * 【ロール仕様】
 * ① saasOwner（SaaSオーナー）
 *      - 全団体の管理が可能
 *      - Users / Organizations / Players / Results を表示
 *
 * ② orgOwner（団体オーナー）
 *      - 自団体の管理が可能
 *      - Organization / Players / Results を表示
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
  role: "saasOwner" | "orgOwner";
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
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Dashboard</h1>
          <p className={styles.welcomeSubtitle}>管理メニューを選択してください</p>
        </section>

        <div className={styles.grid}>
          {/* ------------------------------------------------------------------
           * SaaSオーナー専用メニュー
           * ---------------------------------------------------------------- */}
          {role === "saasOwner" && (
            <>
              <Link href="/users" className={styles.card}>
                <div className={styles.cardIcon}>👤</div>
                <div className={styles.cardTitle}>ユーザー管理</div>
                <div className={styles.cardDescription}>
                  ログイン可能なユーザーの追加・編集・削除を行います。
                </div>
              </Link>

              <Link href="/organizations" className={styles.card}>
                <div className={styles.cardIcon}>🏢</div>
                <div className={styles.cardTitle}>団体管理</div>
                <div className={styles.cardDescription}>
                  団体（連盟・大学将棋部など）の管理を行います。
                </div>
              </Link>
            </>
          )}

          {/* ------------------------------------------------------------------
           * 団体オーナー専用メニュー
           * ---------------------------------------------------------------- */}
          {role === "orgOwner" && (
            <>
              <Link href="/organization" className={styles.card}>
                <div className={styles.cardIcon}>🏢</div>
                <div className={styles.cardTitle}>団体設定</div>
                <div className={styles.cardDescription}>
                  団体名や基本設定を変更します。
                </div>
              </Link>
            </>
          )}

          {/* ------------------------------------------------------------------
           * 共通メニュー（SaaSオーナー & 団体オーナー）
           * ---------------------------------------------------------------- */}
          <>
            <Link href="/players" className={styles.card}>
              <div className={styles.cardIcon}>👥</div>
              <div className={styles.cardTitle}>対局者管理</div>
              <div className={styles.cardDescription}>
                プレイヤーの登録・編集・削除を行います。
              </div>
            </Link>

            <Link href="/results" className={styles.card}>
              <div className={styles.cardIcon}>📊</div>
              <div className={styles.cardTitle}>対局結果管理</div>
              <div className={styles.cardDescription}>
                対局結果の登録・削除を行います。
              </div>
            </Link>
          </>
        </div>
      </main>
    </div>
  );
}
