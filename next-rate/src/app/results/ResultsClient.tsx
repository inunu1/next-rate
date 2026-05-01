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
 * ① admin（団体オーナー）
 *      - 自団体（currentUserId）のみ操作可能
 *      - 団体選択 UI は表示しない
 *
 * ② owner（SaaS 運営者）
 *      - 複数団体を管理するため、団体選択 UI を表示
 *      - 選択した userId を useResults に渡して操作する
 *
 * ③ useResults フック
 *      - 操作対象の userId を受け取り、API 呼び出し時に userId を付与する
 *
 * 【提供機能】
 * ・対局結果一覧表示
 * ・対局結果検索（日付・プレイヤー）
 * ・対局結果新規登録
 * ・対局結果削除
 *
 * 【例外処理方針】
 * ・API エラーは useResults 側でハンドリング
 * ・画面側では mounted 判定により初期描画を制御
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
   * useResults は userId(string) を受け取るため、
   * selectedUser.value を渡す
   * --------------------------------------------------------------------------
   */
  const R = useResults(selectedUser.value);

  useEffect(() => {
    R.init();
  }, [selectedUser.value]);

  if (!R.mounted) return null;

  return (
    <div className={styles.container}>
      {/* ----------------------------------------------------------------------
       * 画面ヘッダ
       * -------------------------------------------------------------------- */}
      <PageHeader
        title="対局結果管理"
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
        {/* タブ切替 */}
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

        {/* 検索モード */}
        {R.activeTab === "search" ? (
          <FormBar>
            <div className={styles.selectWrapper}>
              <Select
                options={R.playerOptions}
                value={R.playerOpt}
                onChange={R.handlePlayerChange}
                placeholder="プレイヤーで絞り込み"
                width="auto"
              />
            </div>

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
          /* 新規登録モード */
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              R.handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <Select
                options={R.playerOptions}
                value={R.winnerOpt}
                onChange={R.setWinnerOpt}
                placeholder="勝者を選択"
                width="auto"
              />
            </div>

            <div className={styles.selectWrapper}>
              <Select
                options={R.playerOptions}
                value={R.loserOpt}
                onChange={R.setLoserOpt}
                placeholder="敗者を選択"
                width="auto"
              />
            </div>

            <DateInput
              value={R.registerDate}
              onChange={(e) => R.setRegisterDate(e.target.value)}
              width={180}
            />

            <div className={styles.selectWrapper}>
              <Select
                options={R.selectableRounds.map((r) => ({
                  value: String(r),
                  label: `第${r}ラウンド`,
                }))}
                value={
                  R.roundIndex
                    ? {
                        value: R.roundIndex,
                        label: `第${R.roundIndex}ラウンド`,
                      }
                    : null
                }
                onChange={(opt) => R.setRoundIndex(opt?.value ?? "1")}
                placeholder="ラウンド"
                width="auto"
                searchable={false}
              />
            </div>

            <AppButton variant="primary" size="md" type="submit">
              登録
            </AppButton>
          </FormBar>
        )}
      </div>

      {/* ----------------------------------------------------------------------
       * ページネーション（日付移動）
       * -------------------------------------------------------------------- */}
      <div className={styles.paginationBar}>
        <AppButton
          variant="secondary"
          size="md"
          onClick={() => {
            if (R.nextDate) R.fetchResults({ date: R.nextDate });
          }}
        >
          次の日
        </AppButton>

        <div className={styles.pageDate}>{R.date ?? "----/--/--"}</div>

        <AppButton
          variant="secondary"
          size="md"
          onClick={() => {
            if (R.prevDate) R.fetchResults({ date: R.prevDate });
          }}
        >
          前の日
        </AppButton>
      </div>

      {/* ----------------------------------------------------------------------
       * 対局結果一覧テーブル
       * -------------------------------------------------------------------- */}
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
