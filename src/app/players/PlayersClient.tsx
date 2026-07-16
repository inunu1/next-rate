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
 * ・操作結果はトースト通知でフィードバック
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useActionToast } from "@/hooks/useActionToast";

import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import DataGrid from "@/components/DataGrid/DataGrid";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import ManagementPanel, { ManagementTable } from "@/components/ManagementPanel/ManagementPanel";
import managementStyles from "@/components/ManagementPanel/ManagementPanel.module.css";

import { usePlayers } from "./usePlayers";

type Option = { label: string; value: string };

export default function PlayersClient({
  currentOrganizationId,
  role,
  allUsers,
}: {
  currentOrganizationId: string;
  role: "owner" | "admin";
  allUsers?: { id: string; name: string }[];
}) {
  const [selectedUser, setSelectedUser] = useState<Option>({
    label: "自団体",
    value: currentOrganizationId,
  });
  const [isFormOpen, setIsFormOpen] = useState(true);

  const P = usePlayers(selectedUser.value);
  const { init } = P;

  useEffect(() => {
    init();
  }, [init]);

  const playersToastMessages = {
    search: "検索が完了しました",
    "register-success": "プレイヤーを登録しました",
    "register-error": "登録に失敗しました",
    "delete-success": "削除しました",
    "delete-error": "削除に失敗しました",
    "fetch-error": "通信エラーが発生しました",
  };

  // ------------------------------------------------------------
  // トースト通知：usePlayers の lastAction を監視
  // ------------------------------------------------------------
  useActionToast(P.lastAction, playersToastMessages);

  // 検索フォーム（プレイヤー選択）
  const filteredPlayers = useMemo(() => {
    if (!P.playerOpt) return P.players;
    return P.players.filter((p) => p.id === P.playerOpt!.value);
  }, [P.players, P.playerOpt]);

  if (!P.mounted) return null;

  return (
    <ManagementPanel
      title="対局者管理"
      actions={
        <Link href="/dashboard" className={managementStyles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      }
      activeTab={P.activeTab}
      onTabChange={(tab) => {
        P.setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((prev) => !prev)}
      searchContent={
        <FormBar>
          {role === "owner" && allUsers && (
            <Select
              options={allUsers.map((u) => ({
                label: u.name,
                value: u.id,
              }))}
              value={selectedUser}
              onChange={(opt) => opt && setSelectedUser(opt)}
              width="auto"
            />
          )}

          <Select
            options={P.playerOptions}
            value={P.playerOpt}
            onChange={(opt) => opt && P.setPlayerOpt(opt)}
            placeholder="プレイヤーで絞り込み"
            width="auto"
          />

          <AppButton variant="secondary" size="md" onClick={() => P.handleSearch()}>
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
      }
      registerContent={
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
      }
    >
      <ManagementTable>
        <DataGrid
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
      </ManagementTable>
    </ManagementPanel>
  );
}
