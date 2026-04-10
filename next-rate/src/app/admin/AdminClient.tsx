"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Admin.module.css";

import Table from "@/components/Table/Table";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";

import { useAdmin } from "./useAdmin";

export default function AdminClient({ currentUserId }: { currentUserId: string }) {
  const A = useAdmin(currentUserId);

  useEffect(() => {
    A.init();
  }, []);

  if (!A.mounted) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>管理者管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* Form Card */}
      <div className={styles.formCard}>
        {/* Tabs */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              A.activeTab === "search" ? styles.tabActive : ""
            }`}
            onClick={() => A.setActiveTab("search")}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              A.activeTab === "register" ? styles.tabActive : ""
            }`}
            onClick={() => A.setActiveTab("register")}
          >
            ✍️ 新規登録
          </button>
        </div>

        {/* Search Mode */}
        {A.activeTab === "search" ? (
          <FormBar>
            <div className={styles.selectWrapper}>
              <Select
                options={A.adminOptions}
                value={A.searchOpt}
                onChange={A.setSearchOpt}
                placeholder="管理者で絞り込み"
                width="260px"
              />
            </div>

            <AppButton variant="secondary" size="md" onClick={A.handleSearch}>
              検索
            </AppButton>

            <AppButton variant="secondary" size="md" onClick={A.clearSearch}>
              クリア
            </AppButton>
          </FormBar>
        ) : (
          /* Register Mode */
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              A.handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <Select
                options={A.adminOptions}
                value={A.registerOpt}
                onChange={A.setRegisterOpt}
                placeholder="新規管理者の名前を入力"
                width="260px"
                mode="creatable"
              />
            </div>

            <Input
              type="email"
              placeholder="メールアドレス（新規登録時）"
              value={A.email}
              onChange={(e) => A.setEmail(e.target.value)}
              width={260}
            />

            <Input
              type="password"
              placeholder="パスワード（新規登録時）"
              value={A.password}
              onChange={(e) => A.setPassword(e.target.value)}
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
            rows={A.filteredUsers}
            columns={[
              { header: "Email", render: (u) => u.email },
              { header: "Name", render: (u) => u.name ?? "未設定" },
              {
                header: "操作",
                render: (u) =>
                  u.id !== A.currentUserId && (
                    <AppButton
                      variant="danger"
                      size="md"
                      onClick={() => A.handleDelete(u.id)}
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
