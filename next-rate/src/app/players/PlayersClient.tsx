"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Players.module.css";

import DataTable from "@/components/DataTable";
import PlayerSelect from "@/components/PlayerSelect";
import Input from "@/components/DateInput/DateInput";

import { usePlayers } from "./usePlayers";

export default function PlayersClient({ currentUserId }: { currentUserId: string }) {
  const P = usePlayers(currentUserId);

  useEffect(() => {
    P.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!P.mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>対局者管理</h1>
        <Link href="/dashboard" className={styles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      </header>

      <div className={styles.formCard}>
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${P.activeTab === "search" ? styles.tabActive : ""}`}
            onClick={() => P.setActiveTab("search")}
          >
            🔍 検索
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${P.activeTab === "register" ? styles.tabActive : ""}`}
            onClick={() => P.setActiveTab("register")}
          >
            ✍️ 新規登録
          </button>
        </div>

        {P.activeTab === "search" ? (
          <div className={styles.formBar}>
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={P.playerOptions}
                value={P.searchOpt}
                onChange={P.setSearchOpt}
                placeholder="プレイヤーで絞り込み"
                width="260px"
                mode="select"
              />
            </div>

            <button type="button" onClick={P.handleSearch} className="btn-ghost">
              検索
            </button>

            <button type="button" onClick={P.clearSearch} className="btn-clear">
              クリア
            </button>
          </div>
        ) : (
          <form
            className={styles.formBar}
            onSubmit={(e) => {
              e.preventDefault();
              P.handleRegister();
            }}
          >
            <div className={styles.selectWrapper}>
              <PlayerSelect
                options={P.playerOptions}
                value={P.registerOpt}
                onChange={P.setRegisterOpt}
                placeholder="新規プレイヤー名を入力"
                width="260px"
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
              width={200}
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
            rows={P.filteredPlayers}
            columns={[
              { header: "プレイヤー名", render: (p) => p.name },
              { header: "現在レート", render: (p) => p.currentRate },
              { header: "初期レート", render: (p) => p.initialRate },
              {
                header: "操作",
                render: (p) =>
                  p.id !== P.currentUserId && (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => P.handleSoftDelete(p.id)}
                    >
                      出禁
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