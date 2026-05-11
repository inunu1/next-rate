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
 * 【UI 方針】
 * ・ResultsClient と UI/構造を完全統一
 * ・role（owner / admin）を選択できるようにする
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./User.module.css";

import Table from "@/components/Table/Table";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import PageHeader from "@/components/PageHeader/PageHeader";

import { useUser } from "./useUser";

export default function UserClient({ currentUserId }: { currentUserId: string }) {
  const U = useUser(currentUserId);
  const [isFormOpen, setIsFormOpen] = useState(true);

  useEffect(() => {
    U.init();
  }, [U.init]);

  if (!U.mounted) return null;

  return (
    <div className={styles.container}>
      <PageHeader
        title="団体管理"
        actions={
          <Link href="/dashboard" className={styles.backLink}>
            ← ダッシュボードへ戻る
          </Link>
        }
      />

      {/* ------------------------------------------------------------
       * タブ + フォームカード
       * ------------------------------------------------------------ */}
      <div className={styles.formCard}>
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              U.activeTab === "search" && isFormOpen ? styles.tabActive : ""
            }`}
            onClick={() => {
              U.setActiveTab("search");
              setIsFormOpen(true);
            }}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              U.activeTab === "register" && isFormOpen ? styles.tabActive : ""
            }`}
            onClick={() => {
              U.setActiveTab("register");
              setIsFormOpen(true);
            }}
          >
            ✍️ 新規登録
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              !isFormOpen ? styles.tabActive : ""
            }`}
            onClick={() => setIsFormOpen(false)}
          >
            ✖️ 閉じる
          </button>
        </div>

        {/* ------------------------------------------------------------
         * 検索フォーム
         * ------------------------------------------------------------ */}
        {U.activeTab === "search" && isFormOpen ? (
          <FormBar>
            <Select
              options={U.userOptions}
              value={U.searchOpt}
              onChange={U.setSearchOpt}
              placeholder="団体名で絞り込み"
              width="auto"
            />

            <AppButton variant="secondary" size="md" onClick={U.handleSearch}>
              検索
            </AppButton>

            <AppButton variant="secondary" size="md" onClick={U.clearSearch}>
              クリア
            </AppButton>
          </FormBar>
        ) : U.activeTab === "register" && isFormOpen ? (
          /* ------------------------------------------------------------
           * 新規登録フォーム
           * ------------------------------------------------------------ */
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              U.handleRegister();
            }}
          >
            {/* 団体名（creatable） */}
            <Select
              options={U.userOptions}
              value={U.registerOpt}
              onChange={U.setRegisterOpt}
              placeholder="新規団体名"
              width="auto"
              mode="creatable"
            />

            {/* メール */}
            <Input
              type="email"
              placeholder="メールアドレス"
              value={U.email}
              onChange={(e) => U.setEmail(e.target.value)}
              width={260}
            />

            {/* パスワード */}
            <Input
              type="password"
              placeholder="パスワード"
              value={U.password}
              onChange={(e) => U.setPassword(e.target.value)}
              width={260}
            />

            {/* ロール選択（owner / admin） */}
            <Select
              options={[
                { label: "owner", value: "owner" },
                { label: "admin", value: "admin" },
              ]}
              value={U.roleOpt}
              onChange={U.setRoleOpt}
              placeholder="ロールを選択"
              width="auto"
            />

            <AppButton variant="primary" size="md" type="submit">
              新規登録
            </AppButton>
          </FormBar>
        ) : null}
      </div>

      {/* ------------------------------------------------------------
       * 団体一覧テーブル
       * ------------------------------------------------------------ */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <Table
            className={styles.table}
            rows={U.filteredUsers}
            columns={[
              {
                header: "Email",
                mobileLabel: "Email",
                render: (u) => u.email
              },
              {
                header: "団体名",
                mobileLabel: "団体名",
                render: (u) => u.name ?? "未設定"
              },
              {
                header: "ロール",
                mobileLabel: "ロール",
                render: (u) => u.role
              },
              {
                header: "操作",
                mobileLabel: "操作",
                render: (u) => (
                  u.id !== U.currentUserId && (
                    <AppButton
                      variant="danger"
                      size="md"
                      onClick={() => U.handleDelete(u.id)}
                    >
                      削除
                    </AppButton>
                  )
                ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
