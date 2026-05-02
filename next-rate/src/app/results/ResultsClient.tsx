"use client";

/**
 * ============================================================================
 * 【画面名称】
 * 対局結果管理画面（ResultsClient）
 *
 * 【機能概要】
 * ・団体（userId）に紐づく対局結果の検索・登録・削除を行う。
 *
 * 【設計方針】
 * ① admin：自団体のみ操作
 * ② owner：団体選択 UI を表示し、選択団体を操作
 * ③ useResults は userId を受け取り、API に userId を付与
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Results.module.css";

import Select from "@/components/Select/Select";
import DateInput from "@/components/DateInput/DateInput";
import Table from "@/components/Table/Table";
import AppButton from "@/components/Button/Button";
import PageHeader from "@/components/PageHeader/PageHeader";
import FormBar from "@/components/FormBar/FormBar";

import { useResults } from "./useResults";

type Option = { label: string; value: string };

export default function ResultsClient({
  currentUserId,
  role,
  allUsers,
}: {
  currentUserId: string;
  role: "owner" | "admin";
  allUsers?: { id: string; name: string }[];
}) {
  const [selectedUser, setSelectedUser] = useState<Option>({
    label: "自団体",
    value: currentUserId,
  });

  const R = useResults(selectedUser.value);

  useEffect(() => {
    R.init();
  }, [R.init]);

  if (!R.mounted) return null;

  return (
    <div className={styles.container}>
      <PageHeader
        title="対局結果管理"
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
              R.activeTab === "search" ? styles.tabActive : ""
            }`}
            onClick={() => R.setActiveTab("search")}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              R.activeTab === "register" ? styles.tabActive : ""
            }`}
            onClick={() => R.setActiveTab("register")}
          >
            ✍️ 新規登録
          </button>
        </div>

        {R.activeTab === "search" ? (
          <FormBar>
            {role === "owner" && allUsers && (
              <Select
                options={allUsers.map((u) => ({
                  label: u.name,
                  value: u.id,
                }))}
                value={selectedUser}
                onChange={(opt) => opt && setSelectedUser(opt)}
                width={260}
              />
            )}

            <Select
              options={R.playerOptions}
              value={R.playerOpt}
              onChange={R.handlePlayerChange}
              placeholder="プレイヤーで絞り込み"
              width="auto"
            />

            <DateInput
              value={R.searchDate}
              onChange={(e) => R.setSearchDate(e.target.value)}
              width={180}
            />

            <AppButton variant="secondary" size="md" onClick={R.handleSearch}>
              検索
            </AppButton>

            <AppButton variant="secondary" size="md" onClick={R.clearSearch}>
              クリア
            </AppButton>
          </FormBar>
        ) : (
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              R.handleRegister();
            }}
          >
            {role === "owner" && allUsers && (
              <Select
                options={allUsers.map((u) => ({
                  label: u.name,
                  value: u.id,
                }))}
                value={selectedUser}
                onChange={(opt) => opt && setSelectedUser(opt)}
                width={260}
              />
            )}

            <Select
              options={R.playerOptions}
              value={R.winnerOpt}
              onChange={R.setWinnerOpt}
              placeholder="勝者"
              width="auto"
            />

            <Select
              options={R.playerOptions}
              value={R.loserOpt}
              onChange={R.setLoserOpt}
              placeholder="敗者"
              width="auto"
            />

            <DateInput
              value={R.registerDate}
              onChange={(e) => R.setRegisterDate(e.target.value)}
              width={180}
            />

            <Select
              options={R.selectableRounds.map((r) => ({
                value: String(r),
                label: `第${r}ラウンド`,
              }))}
              value={
                R.roundIndex
                  ? { value: R.roundIndex, label: `第${R.roundIndex}ラウンド` }
                  : null
              }
              onChange={(opt) => R.setRoundIndex(opt?.value ?? "1")}
              width="auto"
            />

            <AppButton variant="primary" size="md" type="submit">
              登録
            </AppButton>
          </FormBar>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.paginationBar}>
        <AppButton
          variant="secondary"
          size="md"
          onClick={() => R.nextDate && R.fetchResults({ date: R.nextDate })}
        >
          次の日
        </AppButton>

        <div className={styles.pageDate}>{R.date ?? "----/--/--"}</div>

        <AppButton
          variant="secondary"
          size="md"
          onClick={() => R.prevDate && R.fetchResults({ date: R.prevDate })}
        >
          前の日
        </AppButton>
      </div>

      {/* Table */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <Table
            className={styles.table}
            rows={R.results}
            columns={[
              {
                header: "日付",
                render: (r) => {
                  const s = r.matchDate.toString();
                  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
                },
              },
              { header: "ラウンド", render: (r) => `R${r.roundIndex}` },
              {
                header: "勝者（開始時）",
                render: (r) => `${r.winnerName} (${r.winnerRate})`,
              },
              {
                header: "敗者（開始時）",
                render: (r) => `${r.loserName} (${r.loserRate})`,
              },
              {
                header: "操作",
                render: (r) => (
                  <AppButton
                    variant="danger"
                    size="md"
                    onClick={() => R.handleDelete(r.id)}
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
