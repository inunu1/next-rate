"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./Players.module.css";

import Table from "@/components/Table/Table";
import Select from "@/components/Select/Select";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import Input from "@/components/DateInput/DateInput"; // number input として使う
import PageHeader from "@/components/PageHeader/PageHeader";

import { usePlayers } from "./usePlayers";

export default function PlayersClient({ currentUserId }: { currentUserId: string }) {
  const P = usePlayers(currentUserId);

  useEffect(() => {
    P.init();
  }, []);

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

      {/* Form Card */}
      <div className={styles.formCard}>
        {/* Tabs */}
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

        {/* Search Mode */}
        {P.activeTab === "search" ? (
          <FormBar>
            <div className={styles.selectWrapper}>
              <Select
                options={P.playerOptions}
                value={P.searchOpt}
                onChange={P.setSearchOpt}
                placeholder="プレイヤーで絞り込み"
                width="260px"
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
          /* Register Mode */
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
                width="260px"
                mode="creatable"
              />
            </div>

            {/* 初期レートは number 入力（usePlayers に合わせる） */}
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

      {/* Table */}
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
                render: (p) =>
                  p.id !== P.currentUserId && (
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
