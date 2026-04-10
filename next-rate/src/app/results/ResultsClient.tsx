"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Results.module.css";

import Select from "@/components/Select/Select";
import DateInput from "@/components/DateInput/DateInput";
import Table from "@/components/Table/Table";
import AppButton from "@/components/Button/Button";
import PageHeader from "@/components/PageHeader/PageHeader";

import FormBar from "@/components/FormBar/FormBar";
import { useResults } from "./useResults";

export default function ResultsClient() {
  const R = useResults();

  useEffect(() => {
    R.init();
  }, []);

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
        {/* Tabs */}
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

        {/* Search Mode */}
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
          /* Register Mode */
          <FormBar as="form" onSubmit={(e) => R.handleRegister(e)}>
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

      {/* Pagination */}
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
