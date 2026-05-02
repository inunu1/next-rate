"use client";

/**
 * ============================================================================
 * 【画面名称】
 * 対局者管理画面（PlayersClient）
 *
 * 【機能概要】
 * ・団体（userId）に紐づくプレイヤーの登録・検索・削除を行う。
 *
 * 【UI 方針】
 * ・ResultsClient と UI/構造を統一
 *   - タブ（検索 / 新規登録）
 *   - FormBar による横並びフォーム
 *   - Select / Table / Button / PageHeader の共通コンポーネント利用
 *   - 初期レートもテーブルに表示
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./Players.module.css";

import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import PageHeader from "@/components/PageHeader/PageHeader";
import Table from "@/components/Table/Table";
import Select from "@/components/Select/Select";

import { usePlayers } from "./usePlayers";

type Option = { label: string; value: string };

export default function PlayersClient({
  currentUserId,
  role,
  allUsers,
}: {
  currentUserId: string;
  role: "owner" | "admin";
  allUsers?: { id: string; name: string }[];
}) {
  // 団体選択（owner のみ）
  const [selectedUser, setSelectedUser] = useState<Option>({
    label: "自団体",
    value: currentUserId,
  });

  const P = usePlayers(selectedUser.value);

  useEffect(() => {
    P.init();
  }, [P.init]);

  // 検索フォーム（プレイヤー選択）
  const filteredPlayers = useMemo(() => {
    if (!P.playerOpt) return P.players;
    return P.players.filter((p) => p.id === P.playerOpt!.value);
  }, [P.players, P.playerOpt]);

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

        {P.activeTab === "search" ? (
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
              options={P.playerOptions}
              value={P.playerOpt}
              onChange={(opt) => opt && P.setPlayerOpt(opt)}
              placeholder="プレイヤーで絞り込み"
              width="auto"
            />

            <AppButton variant="secondary" size="md">
              検索
            </AppButton>

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => P.setPlayerOpt(null)}
            >
              クリア
            </AppButton>
          </FormBar>
        ) : (
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              P.handleRegister();
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
              options={P.playerOptions}
              value={null}
              onChange={(opt) => {
                if (opt) {
                  P.setName(opt.label);
                } else {
                  P.setName("");
                }
              }}
              placeholder="新規プレイヤー名"
              width="auto"
              mode="creatable"
            />

            <input
              className={styles.numberInput}
              type="number"
              placeholder="初期レート"
              value={P.initialRate}
              onChange={(e) => P.setInitialRate(e.target.value)}
            />

            <AppButton variant="primary" size="md" type="submit">
              登録
            </AppButton>
          </FormBar>
        )}
      </div>

      {/* 一覧テーブル（初期レートも表示） */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <Table
            className={styles.table}
            rows={filteredPlayers}
            columns={[
              { header: "名前", render: (p) => p.name },
              { header: "初期レート", render: (p) => p.initialRate },
              { header: "現在レート", render: (p) => p.currentRate },
              {
                header: "操作",
                render: (p) => (
                  <AppButton
                    variant="danger"
                    size="md"
                    onClick={() => P.handleDelete(p.id)}
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
