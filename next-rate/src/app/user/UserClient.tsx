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
 * ① admin は団体管理を行わないため、この画面は owner 専用。
 * ② useUser は userId を受け取り、団体 CRUD を行う。
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

      {/* Form Card */}
      <div className={styles.formCard}>
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

        {U.activeTab === "search" ? (
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
        ) : (
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              U.handleRegister();
            }}
          >
            <Select
              options={U.userOptions}
              value={U.registerOpt}
              onChange={U.setRegisterOpt}
              placeholder="新規団体名"
              width="auto"
              mode="creatable"
            />

            <Input
              type="email"
              placeholder="メールアドレス"
              value={U.email}
              onChange={(e) => U.setEmail(e.target.value)}
              width={260}
            />

            <Input
              type="password"
              placeholder="パスワード"
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

      {/* Table */}
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
