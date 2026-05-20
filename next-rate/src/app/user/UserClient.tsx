"use client";

/**
 * ============================================================================
 * 【画面名称】
 * ユーザー管理画面（UserClient）
 *
 * 【機能概要】
 * ・SaaS 運営者（owner）がユーザーを管理する画面。
 * ・ユーザーの検索・新規登録・ロール変更・削除を行う。
 *
 * 【UI 方針】
 * ・PlayersClient / ResultsClient と UI/構造を完全統一
 * ・systemRole（owner / user）を選択できるようにする
 * ・操作結果はトースト通知でフィードバック
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import styles from "./User.module.css";

import DataGrid from "@/components/DataGrid/DataGrid";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import PageHeader from "@/components/PageHeader/PageHeader";
import Tabs from "@/components/Tabs/Tabs";

import { useUser } from "./useUser";

export default function UserClient({ currentUserId }: { currentUserId: string }) {
  const U = useUser(currentUserId);
  const [isFormOpen, setIsFormOpen] = useState(true);

  useEffect(() => {
    U.init();
  }, [U.init]);

  // ------------------------------------------------------------
  // トースト通知
  // ------------------------------------------------------------
  useEffect(() => {
    switch (U.lastAction) {
      case "search":
        toast.success("検索が完了しました");
        break;
      case "register-success":
        toast.success("ユーザーを登録しました");
        break;
      case "register-error":
        toast.error("登録に失敗しました");
        break;
      case "delete-success":
        toast.success("削除しました");
        break;
      case "delete-error":
        toast.error("削除に失敗しました");
        break;
      case "fetch-error":
        toast.error("通信エラーが発生しました");
        break;
    }
  }, [U.lastAction]);

  if (!U.mounted) return null;

  return (
    <div className={styles.container}>
      <PageHeader
        title="ユーザー管理"
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
        <Tabs
          tabs={[
            {
              id: "search",
              label: "🔍 検索",
              active: U.activeTab === "search" && isFormOpen,
              onClick: () => {
                U.setActiveTab("search");
                setIsFormOpen(true);
              },
            },
            {
              id: "register",
              label: "✍️ 新規登録",
              active: U.activeTab === "register" && isFormOpen,
              onClick: () => {
                U.setActiveTab("register");
                setIsFormOpen(true);
              },
            },
          ]}
          closeButton={{
            label: "✖️ 閉じる",
            active: !isFormOpen,
            onClick: () => setIsFormOpen(false),
          }}
        />

        {/* ------------------------------------------------------------
         * 検索フォーム
         * ------------------------------------------------------------ */}
        {U.activeTab === "search" && isFormOpen ? (
          <FormBar>
            <Select
              options={U.userOptions}
              value={U.searchOpt}
              onChange={U.setSearchOpt}
              placeholder="ユーザー名で絞り込み"
              width="auto"
            />

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => U.handleSearch()}
            >
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
            {/* ユーザー名 */}
            <Input
              type="text"
              placeholder="ユーザー名"
              value={U.registerName}
              onChange={(e) => U.setRegisterName(e.target.value)}
              width={260}
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

            {/* ロール選択（owner / user） */}
            <Select
              options={[
                { label: "owner", value: "owner" },
                { label: "user", value: "user" },
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
       * ユーザー一覧テーブル
       * ------------------------------------------------------------ */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataGrid
            className={styles.table}
            rows={U.filteredUsers}
            columns={[
              {
                header: "Email",
                mobileLabel: "Email",
                render: (u) => u.email,
              },
              {
                header: "ユーザー名",
                mobileLabel: "ユーザー名",
                render: (u) => u.name ?? "未設定",
              },
              {
                header: "ロール",
                mobileLabel: "ロール",
                render: (u) => u.systemRole,
              },
              {
                header: "操作",
                mobileLabel: "操作",
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
