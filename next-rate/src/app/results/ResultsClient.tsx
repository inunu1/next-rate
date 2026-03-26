"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Results.module.css";

import DataTable from "@/components/DataTable";
import PlayerSelect from "@/components/PlayerSelect";
import Input from "@/components/Input";

import { useResults } from "./useResults";

export default function ResultsClient() {
  const R = useResults();

  useEffect(() => {
    R.init();
  }, []);

  if (!R.mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>対局結果管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      {/* ============================ */}
      {/* 検索 / 登録タブ */}
      {/* ============================ */}
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

        {/* ============================ */}
        {/* 検索フォーム */}
        {/* ============================ */}
        {R.activeTab === "search" ? (
          <div className={styles.formBar}>
            <div style={{ minWidth: 250 }}>
              <PlayerSelect
                value={R.playerOpt}
                onChange={R.setPlayerOpt}
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
          </div>
        ) : (
          /* ============================ */
          /* 登録フォーム */
          /* ============================ */
          <form className={styles.formBar} onSubmit={R.handleRegister}>
            <div style={{ minWidth: 250 }}>
              <PlayerSelect
                value={R.winnerOpt}
                onChange={R.setWinnerOpt}
                options={R.playerOptions}
                placeholder="勝者を選択"
                mode="select"
              />
            </div>

            <div style={{ minWidth: 250 }}>
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

            <select
              className={styles.roundSelect}
              value={R.roundIndex}
              onChange={(e) => R.setRoundIndex(e.target.value)}
            >
              {R.selectableRounds.map((r) => (
                <option key={r} value={r}>
                  第{r}ラウンド
                </option>
              ))}
            </select>

            <button type="submit" className={styles.registerButton}>
              登録
            </button>
          </form>
        )}
      </div>

      {/* ============================ */}
      {/* ページネーション */}
      {/* ============================ */}
      {(R.prevDate || R.nextDate) && (
        <div className={styles.paginationBar}>
          <button
            type="button"
            onClick={() =>
              R.nextDate &&
              R.fetchResults({
                date: R.nextDate,
                ...(R.playerOpt ? { playerId: R.playerOpt.value } : {}),
              })
            }
            disabled={!R.nextDate}
            className={styles.pageButton}
          >
            次の日
          </button>

          <span className={styles.pageDate}>
            {R.date ? R.date : R.playerOpt ? "" : "データなし"}
          </span>

          <button
            type="button"
            onClick={() =>
              R.prevDate &&
              R.fetchResults({
                date: R.prevDate,
                ...(R.playerOpt ? { playerId: R.playerOpt.value } : {}),
              })
            }
            disabled={!R.prevDate}
            className={styles.pageButton}
          >
            前の日
          </button>
        </div>
      )}

      {/* ============================ */}
      {/* 対局一覧 */}
      {/* ============================ */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataTable
            tableClass={styles.table}
            rows={R.results}
            columns={[
              {
                header: "日付",
                render: (r) => {
                  const s = r.matchDate.toString();
                  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
                },
              },
              {
                header: "ラウンド",
                render: (r) => `R${r.roundIndex}`,
              },
              {
                header: "勝者（開始時）",
                render: (r) => `${r.winnerName}（${r.winnerRate}）`,
              },
              {
                header: "敗者（開始時）",
                render: (r) => `${r.loserName}（${r.loserRate}）`,
              },
              {
                header: "操作",
                render: (r) => (
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