"use client";

/**
 * ============================================================================
 * 対局結果管理画面（ResultsClient）
 * 2ロール構成（saasOwner / orgOwner）
 * useResults.ts の API に完全準拠
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import styles from "./Results.module.css";

import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import PageHeader from "@/components/PageHeader/PageHeader";
import DataGrid from "@/components/DataGrid/DataGrid";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import Tabs from "@/components/Tabs/Tabs";

import { useResults } from "./useResults";

export default function ResultsClient({
  organizationId,
  role,
}: {
  organizationId: string | null;
  role: "saasOwner" | "orgOwner";
}) {
  const [isFormOpen, setIsFormOpen] = useState(true);

  // ★ SaaSオーナーは団体未選択の可能性がある
  const R = organizationId ? useResults(organizationId) : null;

  // 初期ロード
  useEffect(() => {
    if (organizationId && R) {
      R.init();
    }
  }, [R, organizationId]);

  // トースト通知
  useEffect(() => {
    if (!R) return;

    switch (R.lastAction) {
      case "search":
        toast.success("検索が完了しました");
        break;
      case "register-success":
        toast.success("対局結果を登録しました");
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
  }, [R?.lastAction]);

  // ロール判定
  const canEdit = role === "saasOwner" || role === "orgOwner";

  // SaaSオーナーで団体未選択の場合
  if (!organizationId || !R) {
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
        <p style={{ padding: "20px" }}>団体を選択してください。</p>
      </div>
    );
  }

  // 絞り込み
  const filteredResults = useMemo(() => {
    if (!R.playerOpt) return R.results;
    return R.results.filter(
      (r) =>
        r.winnerId === R.playerOpt!.value ||
        r.loserId === R.playerOpt!.value
    );
  }, [R.results, R.playerOpt]);

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
        <Tabs
          tabs={[
            {
              id: "search",
              label: "🔍 検索",
              active: R.activeTab === "search" && isFormOpen,
              onClick: () => {
                R.setActiveTab("search");
                setIsFormOpen(true);
              },
            },
            ...(canEdit
              ? [
                  {
                    id: "register",
                    label: "✍️ 新規登録",
                    active: R.activeTab === "register" && isFormOpen,
                    onClick: () => {
                      R.setActiveTab("register");
                      setIsFormOpen(true);
                    },
                  },
                ]
              : []),
            {
              id: "close",
              label: "✖️ 閉じる",
              active: !isFormOpen,
              onClick: () => setIsFormOpen(false),
            },
          ]}
        />

        {/* 検索タブ */}
        {R.activeTab === "search" && isFormOpen && (
          <FormBar>
            <Select
              options={R.playerOptions}
              value={R.playerOpt}
              onChange={(opt) => R.handlePlayerChange(opt)}
              placeholder="プレイヤーで絞り込み"
              width="auto"
            />

            <Input
              type="date"
              value={R.searchDate}
              onChange={(e) => R.setSearchDate(e.target.value)}
              width="auto"
            />

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => R.handleSearch()}
            >
              検索
            </AppButton>

            <AppButton
              variant="secondary"
              size="md"
              onClick={() => R.clearSearch()}
            >
              クリア
            </AppButton>
          </FormBar>
        )}

        {/* 新規登録タブ */}
        {R.activeTab === "register" && isFormOpen && canEdit && (
          <FormBar
            as="form"
            onSubmit={(e) => {
              e.preventDefault();
              R.handleRegister();
            }}
          >
            <Input
              type="date"
              value={R.registerDate}
              onChange={(e) => R.setRegisterDate(e.target.value)}
              width="auto"
            />

            <Select
              options={R.playerOptions}
              value={R.winnerOpt}
              onChange={(opt) => R.setWinnerOpt(opt)}
              placeholder="勝者"
              width="auto"
            />

            <Select
              options={R.playerOptions}
              value={R.loserOpt}
              onChange={(opt) => R.setLoserOpt(opt)}
              placeholder="敗者"
              width="auto"
            />

            <Select
              options={R.selectableRounds.map((r) => ({
                value: String(r),
                label: `${r}局目`,
              }))}
              value={{
                value: R.roundIndex,
                label: `${R.roundIndex}局目`,
              }}
              onChange={(opt) => opt && R.setRoundIndex(opt.value)}
              placeholder="ラウンド"
              width="auto"
            />

            <AppButton variant="primary" size="md" type="submit">
              登録
            </AppButton>
          </FormBar>
        )}
      </div>

      {/* 一覧テーブル */}
      <main className={styles.main}>
        <div className={styles.tableWrapper}>
          <DataGrid
            className={styles.table}
            rows={filteredResults}
            columns={[
              {
                header: "日付",
                mobileLabel: "日付",
                render: (r) => {
                  const s = r.matchDate.toString();
                  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
                },
              },
              {
                header: "勝者",
                mobileLabel: "勝者",
                render: (r) => `${r.winnerName} (${r.winnerRate})`,
              },
              {
                header: "敗者",
                mobileLabel: "敗者",
                render: (r) => `${r.loserName} (${r.loserRate})`,
              },
              {
                header: "局",
                mobileLabel: "局",
                render: (r) => r.roundIndex,
              },
              {
                header: "操作",
                mobileLabel: "操作",
                render: (r) =>
                  canEdit ? (
                    <AppButton
                      variant="danger"
                      size="md"
                      onClick={() => R.handleDelete(r.id)}
                    >
                      削除
                    </AppButton>
                  ) : (
                    <span style={{ opacity: 0.5 }}>閲覧のみ</span>
                  ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
