"use client";

/**
 * ============================================================================
 * 【画面名称】
 * ユーザー管理画面（UserClient）
 *
 * 【機能概要】
 * ・SaaS 運営者（owner）がユーザーを管理する画面。
 * ・ユーザーの検索・新規登録・削除を行う。
 *
 * 【UI 方針】
 * ・ResultsClient と UI/構造を完全統一
 * ・role（owner / admin）を選択できるようにする
 * ・操作結果はトースト通知でフィードバック
 * ============================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useActionToast } from "@/hooks/useActionToast";

import DataGrid from "@/components/DataGrid/DataGrid";
import Select from "@/components/Select/Select";
import Input from "@/components/DateInput/DateInput";
import AppButton from "@/components/Button/Button";
import FormBar from "@/components/FormBar/FormBar";
import ManagementPanel, { ManagementTable } from "@/components/ManagementPanel/ManagementPanel";
import managementStyles from "@/components/ManagementPanel/ManagementPanel.module.css";

import { useUser } from "./useUser";

export default function UserClient({ currentUserId }: { currentUserId: string }) {
  const U = useUser(currentUserId);
  const [isFormOpen, setIsFormOpen] = useState(true);

  const { init } = U;
  useEffect(() => {
    init();
  }, [init]);

  const userToastMessages = {
    search: "検索が完了しました",
    "register-success": "ユーザーを登録しました",
    "register-error": "登録に失敗しました",
    "delete-success": "削除しました",
    "delete-error": "削除に失敗しました",
    "fetch-error": "通信エラーが発生しました",
  };

  // ------------------------------------------------------------
  // トースト通知：検索・登録・削除の結果を監視
  // ------------------------------------------------------------
  useActionToast(U.lastAction, userToastMessages);

  if (!U.mounted) return null;

  return (
    <ManagementPanel
      title="ユーザー管理"
      actions={
        <Link href="/dashboard" className={managementStyles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      }
      activeTab={U.activeTab}
      onTabChange={(tab) => {
        U.setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((prev) => !prev)}
      searchContent={
        <FormBar>
          <Select
            options={U.userOptions}
            value={U.searchOpt}
            onChange={U.setSearchOpt}
            placeholder="ユーザー名で絞り込み"
            width="auto"
          />

          <AppButton variant="secondary" size="md" onClick={U.handleSearch}>
            検索
          </AppButton>

          <AppButton variant="secondary" size="md" onClick={U.clearSearch}>
            クリア
          </AppButton>
        </FormBar>
      }
      registerContent={
        <FormBar
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            U.handleRegister();
          }}
        >
          <Input
            type="text"
            placeholder="新規ユーザー名"
            value={U.registerName}
            onChange={(e) => U.setRegisterName(e.target.value)}
            width={260}
          />

          <Input
            type="email"
            placeholder="メールアドレス"
            value={U.email}
            onChange={(e) => U.setEmail(e.target.value)}
            width={260}
          />

          <Input
            type="password"
            placeholder="パスワード"
            value={U.password}
            onChange={(e) => U.setPassword(e.target.value)}
            width={260}
          />

          <Select
            options={[
              { label: "owner", value: "owner" },
              { label: "admin", value: "admin" },
              { label: "editer", value: "editer" },
              { label: "viewer", value: "viewer" },
            ]}
            value={U.roleOpt}
            onChange={U.setRoleOpt}
            placeholder="ロールを選択"
            width="auto"
          />

          {U.roleOpt?.value !== "owner" && U.roleOpt ? (
            <Select
              options={U.organizationOptions}
              value={U.organizationOpt}
              onChange={U.setOrganizationOpt}
              placeholder="所属団体を選択"
              width="auto"
            />
          ) : null}

          <AppButton variant="primary" size="md" type="submit">
            新規登録
          </AppButton>
        </FormBar>
      }
    >
      <ManagementTable>
        <DataGrid
          rows={U.filteredUsers}
          columns={[
            {
              header: "Email",
              mobileLabel: "Email",
              render: (u) => u.email,
            },
            {
              header: "名前",
              mobileLabel: "名前",
              render: (u) => u.name ?? "未設定",
            },
            {
              header: "ロール",
              mobileLabel: "ロール",
              render: (u) => u.role,
            },
            {
              header: "操作",
              mobileLabel: "操作",
              render: (u) =>
                u.id !== U.currentUserId && (
                  <AppButton
                    variant="danger"
                    size="md"
                    onClick={() => {
                      U.handleDelete(u.id);
                    }}
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
