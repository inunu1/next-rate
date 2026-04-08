"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Results.module.css";

import PlayerSelect from "@/components/PlayerSelect";
import Input from "@/components/Input";
import DataTable from "@/components/DataTable";
import AppButton from "@/components/AppButton/AppButton";

import { useResults } from "./useResults";

export default function ResultsClient() {
  const R = useResults();

  useEffect(() => {
    R.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div className={styles.formBar}>
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={R.playerOptions}
                value={R.playerOpt}
                onChange={R.handlePlayerChange}
                placeholder="プレイヤーで絞り込み"
                width="260px"
                mode="select"
              />
            </div>

            <Input
              type="date"
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
          </div>
        ) : (
          /* Register Mode */
          <form
            className={styles.formBar}
            onSubmit={(e) => R.handleRegister(e)}
          >
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={R.playerOptions}
                value={R.winnerOpt}
                onChange={R.setWinnerOpt}
                placeholder="勝者を選択"
                width="260px"
                mode="select"
              />
            </div>

            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={R.playerOptions}
                value={R.loserOpt}
                onChange={R.setLoserOpt}
                placeholder="敗者を選択"
                width="260px"
                mode="select"
              />
            </div>

            <Input
              type="date"
              value={R.registerDate}
              onChange={(e) => R.setRegisterDate(e.target.value)}
              width={180}
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

            <AppButton variant="primary" size="md" type="submit">
              登録
            </AppButton>
          </form>
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
                    size="sm"
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
