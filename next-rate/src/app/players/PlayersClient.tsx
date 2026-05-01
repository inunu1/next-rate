"use client";

/**
 * ============================================================================
 * 【画面名称】
 * 対局者管理画面（PlayersClient）
 *
 * 【設計方針】
 * ・owner：団体選択 UI を表示し、選択した団体の userId を使用
 * ・admin：currentUserId を固定使用
 * ・Select コンポーネントは Option 型を使用するため、value/onChange を Option に統一
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Players.module.css";

import Table from "@/components/Table/Table";
import Select from "@/components/Select/Select";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import Input from "@/components/DateInput/DateInput";
import PageHeader from "@/components/PageHeader/PageHeader";

import { usePlayers } from "./usePlayers";

// Select の Option 型（あなたの Select コンポーネントに合わせる）
type Option = { label: string; value: string };

export default function PlayersClient({
  currentUserId,
  role,
  allUsers,
}: {
  currentUserId: string;
  role: "owner" | "admin";
  allUsers?: { id: string; name: string }[];
}) {
  /**
   * --------------------------------------------------------------------------
   * 【団体選択 state】
   * ・Select は Option 型を要求するため Option | null を保持する
   * ・admin は団体選択 UI を持たないため currentUserId を Option 化して固定
   * --------------------------------------------------------------------------
   */
  const [selectedUser, setSelectedUser] = useState<Option>({
    label: "自団体",
    value: currentUserId,
  });

  /**
   * --------------------------------------------------------------------------
   * usePlayers は userId(string) を受け取るため、
   * selectedUser.value を渡す
   * --------------------------------------------------------------------------
   */
  const P = usePlayers(selectedUser.value);

  useEffect(() => {
    P.init();
  }, [selectedUser.value]);

  if (!P.mounted) return null;

  return (
    <div className={styles.container}>
      <PageHeader
        title="対局者管理"
        actions={
          <Link href="/dashboard" className={styles.backLink}>
            ← ダッシュボードへ戻る
          </Link>
        }
      />

      {/* ----------------------------------------------------------------------
       * owner のみ団体選択 UI を表示
       * -------------------------------------------------------------------- */}
      {role === "owner" && allUsers && (
        <div className={styles.orgSelector}>
          <Select
            options={allUsers.map((u) => ({
              label: u.name,
              value: u.id,
            }))}
            value={selectedUser}
            onChange={(opt) => opt && setSelectedUser(opt)}
            placeholder="団体を選択"
            width={260}
            mode="select"
          />
        </div>
      )}

      {/* ----------------------------------------------------------------------
       * 入力フォーム（検索 / 新規登録）
       * -------------------------------------------------------------------- */}
      <div className={styles.formCard}>
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              P.activeTab === "search" ? styles.tabActive : ""
            }`}
            onClick={() => P.setActiveTab("search")}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              P.activeTab === "register" ? styles.tabActive : ""
            }`}
            onClick={() => P.setActiveTab("register")}
          >
            ✍️ 新規登録
          </button>
        </div>

        {/* 検索モード */}
        {P.activeTab === "search" ? (
          <FormBar>
            <div className={styles.selectWrapper}>
              <Select
                options={P.playerOptions}
                value={P.searchOpt}
                onChange={P.setSearchOpt}
                placeholder="プレイヤーで絞り込み"
                width="auto"
                mode="select"
              />
            </div>

            <AppButton variant="secondary" size="md" onClick={P.handleSearch}>
              検索
            </AppButton>

            <AppButton variant="secondary" size="md" onClick={P.clearSearch}>
              クリア
            </AppButton>
          </FormBar>
        ) : (
          /* 新規登録モード */
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              P.handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <Select
                options={P.playerOptions}
                value={P.registerOpt}
                onChange={P.setRegisterOpt}
                placeholder="新規プレイヤー名を入力"
                width="auto"
                mode="creatable"
              />
            </div>

            <Input
              type="number"
              placeholder="初期レート (例: 1500)"
              value={P.initialRate}
              onChange={(e) => P.setInitialRate(e.target.value)}
              min={1000}
              max={9999}
              width={180}
            />

            <AppButton variant="primary" size="md" type="submit">
              新規登録
            </AppButton>
          </FormBar>
        )}
      </div>

      {/* ----------------------------------------------------------------------
       * プレイヤー一覧テーブル
       * -------------------------------------------------------------------- */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <Table
            className={styles.table}
            rows={P.filteredPlayers}
            columns={[
              { header: "プレイヤー名", render: (p) => p.name },
              { header: "現在レート", render: (p) => p.currentRate },
              { header: "初期レート", render: (p) => p.initialRate },
              {
                header: "操作",
                render: (p) => (
                  <AppButton
                    variant="danger"
                    size="md"
                    onClick={() => P.handleSoftDelete(p.id)}
                  >
                    出禁
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
