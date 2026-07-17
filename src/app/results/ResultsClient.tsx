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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useActionToast } from "@/hooks/useActionToast";

import Select from "@/components/Select/Select";
import DateInput from "@/components/DateInput/DateInput";
import DataGrid from "@/components/DataGrid/DataGrid";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import ManagementPanel, { ManagementTable } from "@/components/ManagementPanel/ManagementPanel";
import managementStyles from "@/components/ManagementPanel/ManagementPanel.module.css";
import styles from "./Results.module.css";

import { useResults } from "./useResults";

type Option = { label: string; value: string };

export default function ResultsClient({
  currentOrganizationId,
  role,
  allUsers,
}: {
  currentOrganizationId: string;
  role: "owner" | "admin" | "editer" | "viewer";
  allUsers?: { id: string; name: string }[];
}) {
  const [selectedUser, setSelectedUser] = useState<Option>({
    label: "自団体",
    value: currentOrganizationId,
  });
  const [isFormOpen, setIsFormOpen] = useState(true);
  const router = useRouter();

  const R = useResults(selectedUser.value);
  const { init } = R;

  useEffect(() => {
    init();
  }, [init]);

  const resultsToastMessages = {
    search: "検索が完了しました",
    "register-success": "対局結果を登録しました",
    "register-error": "登録に失敗しました",
    "delete-success": "削除しました",
    "delete-error": "削除に失敗しました",
    "fetch-error": "通信エラーが発生しました",
  };

  // ------------------------------------------------------------
  // トースト通知：useResults の lastAction を監視
  // ------------------------------------------------------------
  useActionToast(R.lastAction, resultsToastMessages);

  if (!R.mounted) return null;

  return (
    <ManagementPanel
      title="対局結果管理"
      actions={
        <Link href="/dashboard" className={managementStyles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      }
      activeTab={R.activeTab}
      onTabChange={(tab) => {
        R.setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((prev) => !prev)}
      searchContent={
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

          <AppButton variant="secondary" size="md" onClick={() => R.handleSearch()}>
            検索
          </AppButton>

          <AppButton variant="secondary" size="md" onClick={R.clearSearch}>
            クリア
          </AppButton>
        </FormBar>
      }
      registerContent={
        <FormBar
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            const success = await R.handleRegister();
            if (success) {
              router.push("/results");
            }
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
      }
    >
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

      <ManagementTable>
        <DataGrid
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
      </ManagementTable>
    </ManagementPanel>
  );
}
