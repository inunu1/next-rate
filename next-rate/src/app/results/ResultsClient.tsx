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
import { toast } from "sonner"; // ★ トースト追加
import styles from "./Results.module.css";

import Select from "@/components/Select/Select";
import DateInput from "@/components/DateInput/DateInput";
import DataGrid from "@/components/DataGrid/DataGrid";
import AppButton from "@/components/Button/Button";
import PageHeader from "@/components/PageHeader/PageHeader";
import FormBar from "@/components/FormBar/FormBar";
import Tabs from "@/components/Tabs/Tabs";

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
  const [isFormOpen, setIsFormOpen] = useState(true);

  const R = useResults(selectedUser.value);

  useEffect(() => {
    R.init();
  }, [R.init]);

  // ------------------------------------------------------------
  // トースト通知：useResults の lastAction を監視
  // ------------------------------------------------------------
  useEffect(() => {
    switch (R.lastAction) {
      case "search":
        toast.success("検索が完了しました");
        break;
      case "register-success":
        toast.success("対局結果を登録しました");
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
    }
  }, [R.lastAction]);

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
        <Tabs
          tabs={[
            {
              id: "search",
              label: "🔍 検索",
              active: R.activeTab === "search" && isFormOpen,
              onClick: () => {
                R.setActiveTab("search");
                setIsFormOpen(true);
              },
            },
            {
              id: "register",
              label: "✍️ 新規登録",
              active: R.activeTab === "register" && isFormOpen,
              onClick: () => {
                R.setActiveTab("register");
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

        {R.activeTab === "search" && isFormOpen ? (
          <FormBar>
            {role === "owner" && allUsers && (
              <Select
                options={allUsers.map((u) => ({
                  label: u.name,
                  value: u.id,
                }))}
                value={selectedUser}
                onChange={(opt) => opt && setSelectedUser(opt)}
                width="auto"
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

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => {
                R.handleSearch();
              }}
            >
              検索
            </AppButton>

            <AppButton variant="secondary" size="md" onClick={R.clearSearch}>
              クリア
            </AppButton>
          </FormBar>
        ) : R.activeTab === "register" && isFormOpen ? (
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
                width="auto"
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
        ) : null}
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
          <DataGrid
            className={styles.table}
            rows={R.results}
            columns={[
              {
                header: "日付",
                mobileLabel: "日付",
                render: (r) => {
                  const s = r.matchDate.toString();
                  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
                },
              },
              {
                header: "R",
                mobileLabel: "ラウンド",
                render: (r) => `R${r.roundIndex}`,
              },
              {
                header: "勝者（開始時）",
                mobileLabel: "勝者",
                render: (r) => `${r.winnerName} (${r.winnerRate})`,
              },
              {
                header: "敗者（開始時）",
                mobileLabel: "敗者",
                render: (r) => `${r.loserName} (${r.loserRate})`,
              },
              {
                header: "操作",
                mobileLabel: "操作",
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
