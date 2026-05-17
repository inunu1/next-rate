"use client";

/**
 * ============================================================================
 * 対局者管理画面（PlayersClient）完全版
 * - 団体（organizationId）に紐づくプレイヤー管理
 * - userId ベースの旧仕様を完全排除
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import styles from "./Players.module.css";

import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import PageHeader from "@/components/PageHeader/PageHeader";
import DataGrid from "@/components/DataGrid/DataGrid";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import Tabs from "@/components/Tabs/Tabs";

import { usePlayers } from "./usePlayers";

export default function PlayersClient({
  organizationId,
  role,
}: {
  organizationId: string;
  role: "owner" | "editor" | "viewer";
}) {
  const [isFormOpen, setIsFormOpen] = useState(true);

  // ★ usePlayers は organizationId を受け取る
  const P = usePlayers(organizationId);

  useEffect(() => {
    P.init();
  }, [P]); // ★ P.init ではなく P を依存にする（ESLint 対応）

  // ------------------------------------------------------------
  // トースト通知
  // ------------------------------------------------------------
  useEffect(() => {
    switch (P.lastAction) {
      case "search":
        toast.success("検索が完了しました");
        break;
      case "register-success":
        toast.success("プレイヤーを登録しました");
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
      case "fetch-error":
        toast.error("通信エラーが発生しました");
        break;
    }
  }, [P.lastAction]);

  // ------------------------------------------------------------
  // 絞り込み
  // ------------------------------------------------------------
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
        <Tabs
          tabs={[
            {
              id: "search",
              label: "🔍 検索",
              active: P.activeTab === "search" && isFormOpen,
              onClick: () => {
                P.setActiveTab("search");
                setIsFormOpen(true);
              },
            },
            {
              id: "register",
              label: "✍️ 新規登録",
              active: P.activeTab === "register" && isFormOpen,
              onClick: () => {
                P.setActiveTab("register");
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

        {P.activeTab === "search" && isFormOpen ? (
          <FormBar>
            <Select
              options={P.playerOptions}
              value={P.playerOpt}
              onChange={(opt) => opt && P.setPlayerOpt(opt)}
              placeholder="プレイヤーで絞り込み"
              width="auto"
            />

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => P.handleSearch()}
            >
              検索
            </AppButton>

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => {
                P.setPlayerOpt(null);
                P.handleSearch();
              }}
            >
              クリア
            </AppButton>
          </FormBar>
        ) : P.activeTab === "register" && isFormOpen ? (
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              P.handleRegister();
            }}
          >
            <Input
              type="text"
              placeholder="新規プレイヤー名"
              value={P.name}
              onChange={(e) => P.setName(e.target.value)}
              width="auto"
            />

            <Input
              type="number"
              placeholder="初期レート"
              value={P.initialRate}
              onChange={(e) => P.setInitialRate(e.target.value)}
              width={180}
            />

            <AppButton variant="primary" size="md" type="submit">
              登録
            </AppButton>
          </FormBar>
        ) : null}
      </div>

      {/* 一覧テーブル */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataGrid
            className={styles.table}
            rows={filteredPlayers}
            columns={[
              {
                header: "名前",
                mobileLabel: "名前",
                render: (p) => p.name,
              },
              {
                header: "初期レート",
                mobileLabel: "初期レート",
                render: (p) => p.initialRate,
              },
              {
                header: "現在レート",
                mobileLabel: "現在レート",
                render: (p) => p.currentRate,
              },
              {
                header: "操作",
                mobileLabel: "操作",
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
