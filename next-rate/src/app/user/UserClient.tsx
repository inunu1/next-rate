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
 * ・操作結果はトースト通知でフィードバック
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner"; // ← ★ 追加：トースト通知
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
  // トースト通知：検索・登録・削除の結果を監視
  // ------------------------------------------------------------
  useEffect(() => {
    if (U.lastAction === "search") {
      toast.success("検索が完了しました");
    }
    if (U.lastAction === "register-success") {
      toast.success("団体を登録しました");
    }
    if (U.lastAction === "register-error") {
      toast.error("登録に失敗しました");
    }
    if (U.lastAction === "delete-success") {
      toast.success("削除しました");
    }
    if (U.lastAction === "delete-error") {
      toast.error("削除に失敗しました");
    }
    if (U.lastAction === "fetch-error") {
      toast.error("通信エラーが発生しました");
    }
  }, [U.lastAction]);

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
              placeholder="団体名で絞り込み"
              width="auto"
            />

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => {
                U.handleSearch();
                toast("検索中…");
              }}
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
            {/* 団体名 */}
            <Input
              type="text"
              placeholder="新規団体名"
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

            {/* ロール選択 */}
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
                header: "団体名",
                mobileLabel: "団体名",
                render: (u) => u.name ?? "未設定",
              },
              {
                header: "ロール",
                mobileLabel: "ロール",
                render: (u) => u.role,
              },
              {
                header: "操作",
                mobileLabel: "操作",
                render: (u) =>
                  u.id !== U.currentUserId && (
                    <AppButton
                      variant="danger"
                      size="md"
                      onClick={() => {
                        U.handleDelete(u.id);
                      }}
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
