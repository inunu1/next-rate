"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Admin.module.css";

import DataTable from "@/components/DataTable";
import PlayerSelect from "@/components/PlayerSelect";
import Input from "@/components/Input";

import { useAdmin } from "./useAdmin";

export default function AdminClient({ currentUserId }: { currentUserId: string }) {
  const A = useAdmin(currentUserId);

  useEffect(() => {
    A.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!A.mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>管理者管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      <div className={styles.formCard}>
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${A.activeTab === "search" ? styles.tabActive : ""}`}
            onClick={() => A.setActiveTab("search")}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${A.activeTab === "register" ? styles.tabActive : ""}`}
            onClick={() => A.setActiveTab("register")}
          >
            ✍️ 新規登録
          </button>
        </div>

        {A.activeTab === "search" ? (
          <div className={styles.formBar}>
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={A.adminOptions}
                value={A.searchOpt}
                onChange={A.setSearchOpt}
                placeholder="管理者で絞り込み"
                width="260px"
                mode="select"
              />
            </div>

            <button type="button" onClick={A.handleSearch} className="btn-ghost">
              検索
            </button>

            <button type="button" onClick={A.clearSearch} className="btn-clear">
              クリア
            </button>
          </div>
        ) : (
          <form
            className={styles.formBar}
            onSubmit={(e) => {
              e.preventDefault();
              A.handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <PlayerSelect
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

            <button type="submit" className="btn-primary">
              新規登録
            </button>
          </form>
        )}
      </div>

      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataTable
            tableClass={styles.table}
            rows={A.filteredUsers}
            columns={[
              { header: "Email", render: (u) => u.email },
              { header: "Name", render: (u) => u.name ?? "未設定" },
              {
                header: "操作",
                render: (u) =>
                  u.id !== A.currentUserId && (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => A.handleDelete(u.id)}
                    >
                      削除
                    </button>
                  ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
}