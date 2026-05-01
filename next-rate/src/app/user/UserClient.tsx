"use client";

/**
 * ============================================================================
 * 【画面名称】
 * 団体管理画面（UserClient）
 *
 * 【機能概要】
 * ・SaaS 運営者（owner）が団体（User）を管理する画面。
 * ・団体の検索・新規登録・削除を行う。
 *
 * 【設計方針】
 * ① admin（団体オーナー）は団体管理を行わないため、この画面は owner 専用。
 *
 * ② Select コンポーネントは Option 型を使用するため、
 *    searchOpt / registerOpt は Option | null を保持する。
 *
 * ③ useUser フックは currentUserId を受け取り、
 *    owner のみ団体一覧を操作可能とする。
 *
 * 【非責務】
 * ・認証チェック（Server Component 側で実施）
 * ・DB アクセス（API に集約）
 * ============================================================================
 */

import { useEffect } from "react";
import Link from "next/link";
import styles from "./User.module.css";

import Table from "@/components/Table/Table";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import PageHeader from "@/components/PageHeader/PageHeader";

import { useUser } from "./useUser";

export default function UserClient({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const U = useUser(currentUserId);

  useEffect(() => {
    U.init();
  }, []);

  if (!U.mounted) return null;

  return (
    <div className={styles.container}>
      {/* ----------------------------------------------------------------------
       * 画面ヘッダ
       * -------------------------------------------------------------------- */}
      <PageHeader
        title="団体管理"
        actions={
          <Link href="/dashboard" className={styles.backLink}>
            ← ダッシュボードへ戻る
          </Link>
        }
      />

      {/* ----------------------------------------------------------------------
       * 入力フォーム（検索 / 新規登録）
       * -------------------------------------------------------------------- */}
      <div className={styles.formCard}>
        {/* タブ切替 */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              U.activeTab === "search" ? styles.tabActive : ""
            }`}
            onClick={() => U.setActiveTab("search")}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              U.activeTab === "register" ? styles.tabActive : ""
            }`}
            onClick={() => U.setActiveTab("register")}
          >
            ✍️ 新規登録
          </button>
        </div>

        {/* 検索モード */}
        {U.activeTab === "search" ? (
          <FormBar>
            <div className={styles.selectWrapper}>
              <Select
                options={U.userOptions}
                value={U.searchOpt}
                onChange={U.setSearchOpt}
                placeholder="団体名で絞り込み"
                width="auto"
              />
            </div>

            <AppButton variant="secondary" size="md" onClick={U.handleSearch}>
              検索
            </AppButton>

            <AppButton variant="secondary" size="md" onClick={U.clearSearch}>
              クリア
            </AppButton>
          </FormBar>
        ) : (
          /* 新規登録モード */
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              U.handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <Select
                options={U.userOptions}
                value={U.registerOpt}
                onChange={U.setRegisterOpt}
                placeholder="新規団体名を入力"
                width="auto"
                mode="creatable"
              />
            </div>

            <Input
              type="email"
              placeholder="メールアドレス（ログイン用）"
              value={U.email}
              onChange={(e) => U.setEmail(e.target.value)}
              width={260}
            />

            <Input
              type="password"
              placeholder="パスワード（ログイン用）"
              value={U.password}
              onChange={(e) => U.setPassword(e.target.value)}
              width={260}
            />

            <AppButton variant="primary" size="md" type="submit">
              新規登録
            </AppButton>
          </FormBar>
        )}
      </div>

      {/* ----------------------------------------------------------------------
       * 団体一覧テーブル
       * -------------------------------------------------------------------- */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <Table
            className={styles.table}
            rows={U.filteredUsers}
            columns={[
              { header: "Email", render: (u) => u.email },
              { header: "団体名", render: (u) => u.name ?? "未設定" },
              {
                header: "操作",
                render: (u) =>
                  u.id !== U.currentUserId && (
                    <AppButton
                      variant="danger"
                      size="md"
                      onClick={() => U.handleDelete(u.id)}
                    >
                      削除
                    </AppButton>
                  ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
