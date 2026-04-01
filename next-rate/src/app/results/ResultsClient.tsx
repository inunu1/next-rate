"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Results.module.css";

import DataTable from "@/components/DataTable";
import PlayerSelect from "@/components/PlayerSelect";
import Input from "@/components/Input";

import { useResults } from "./useResults";
import type { Result } from "@prisma/client";

export default function ResultsClient() {
  const R = useResults();

  /* ------------------------------------------------------------
   * 初期化
   * ---------------------------------------------------------- */
  useEffect(() => {
    R.init();
  }, []);

  if (!R.mounted) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>対局結果管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* タブ */}
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

        {/* 検索フォーム */}
        {R.activeTab === "search" ? (
          <div className={styles.formBar}>
            <div className={styles.selectWrapper}>
              <PlayerSelect
                value={R.playerOpt}
                onChange={R.handlePlayerChange}
                options={R.playerOptions}
                placeholder="プレイヤーで絞り込み"
                mode="select"
              />
            </div>

            <Input
              type="date"
              value={R.searchDate}
              onChange={(e) => R.setSearchDate(e.target.value)}
              width={150}
            />

            <button
              type="button"
              onClick={R.handleSearch}
              className={styles.searchButton}
            >
              検索
            </button>

            <button
              type="button"
              onClick={R.clearSearch}
              className={styles.clearButton}
            >
              クリア
            </button>
          </div>
        ) : (
          /* 登録フォーム */
          <form className={styles.formBar} onSubmit={R.handleRegister}>
            <div className={styles.selectWrapper}>
              <PlayerSelect
                value={R.winnerOpt}
                onChange={R.setWinnerOpt}
                options={R.playerOptions}
                placeholder="勝者を選択"
                mode="select"
              />
            </div>

            <div className={styles.selectWrapper}>
              <PlayerSelect
                value={R.loserOpt}
                onChange={R.setLoserOpt}
                options={R.playerOptions}
                placeholder="敗者を選択"
                mode="select"
              />
            </div>

            <Input
              type="date"
              value={R.registerDate}
              onChange={(e) => R.setRegisterDate(e.target.value)}
              width={150}
            />

            <PlayerSelect
              value={
                R.roundIndex
                  ? { value: R.roundIndex, label: `第${R.roundIndex}ラウンド` }
                  : null
              }
              onChange={(opt) => R.setRoundIndex(opt?.value ?? "1")}
              options={R.selectableRounds.map((r) => ({
                value: String(r),
                label: `第${r}ラウンド`,
              }))}
              placeholder="ラウンドを選択"
              mode="select"
            />

            <button type="submit" className={styles.registerButton}>
              登録
            </button>
          </form>
        )}
      </div>

      {/* ページネーション */}
      {(R.prevDate || R.nextDate) && (
        <div className={styles.paginationBar}>
          <button
            type="button"
            onClick={() =>
              R.nextDate &&
              R.fetchResults({
                ...R.searchParams,
                date: R.nextDate,
              })
            }
            disabled={!R.nextDate}
            className={styles.pageButton}
          >
            次の日
          </button>

          <span className={styles.pageDate}>
            {R.date ? R.date : "データなし"}
          </span>

          <button
            type="button"
            onClick={() =>
              R.prevDate &&
              R.fetchResults({
                ...R.searchParams,
                date: R.prevDate,
              })
            }
            disabled={!R.prevDate}
            className={styles.pageButton}
          >
            前の日
          </button>
        </div>
      )}

      {/* テーブル */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataTable
            tableClass={styles.table}
            rows={R.results}
            columns={[
              {
                header: "日付",
                render: (r: Result) => {
                  const s = r.matchDate.toString();
                  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
                },
              },
              { header: "ラウンド", render: (r: Result) => `R${r.roundIndex}` },
              {
                header: "勝者（開始時）",
                render: (r: Result) => `${r.winnerName}（${r.winnerRate}）`,
              },
              {
                header: "敗者（開始時）",
                render: (r: Result) => `${r.loserName}（${r.loserRate}）`,
              },
              {
                header: "操作",
                render: (r: Result) => (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => R.handleDelete(r.id)}
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