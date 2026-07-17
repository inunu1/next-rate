"use client";

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

import { useOrganization } from "./useOrganization";

export default function OrganizationClient() {
  const O = useOrganization();
  const [isFormOpen, setIsFormOpen] = useState(true);
  const { init } = O;

  useEffect(() => {
    init();
  }, [init]);

  const orgToastMessages = {
    search: "検索が完了しました",
    "register-success": "団体を登録しました",
    "register-error": "登録に失敗しました",
    "delete-success": "削除しました",
    "delete-error": "削除に失敗しました",
    "fetch-error": "通信エラーが発生しました",
  };

  useActionToast(O.lastAction, orgToastMessages);

  if (!O.mounted) return null;

  return (
    <ManagementPanel
      title="団体管理"
      actions={
        <Link href="/dashboard" className={managementStyles.backLink}>
          ← ダッシュボードへ戻る
        </Link>
      }
      activeTab={O.activeTab}
      onTabChange={(tab) => {
        O.setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((prev) => !prev)}
      searchContent={
        <FormBar>
          <Select
            options={O.userOptions}
            value={O.searchOpt}
            onChange={O.setSearchOpt}
            placeholder="団体名で絞り込み"
            width="auto"
          />

          <AppButton variant="secondary" size="md" onClick={O.handleSearch}>
            検索
          </AppButton>

          <AppButton variant="secondary" size="md" onClick={O.clearSearch}>
            クリア
          </AppButton>
        </FormBar>
      }
      registerContent={
        <FormBar
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            O.handleRegister();
          }}
        >
          <Input
            type="text"
            placeholder="新規団体名"
            value={O.registerName}
            onChange={(e) => O.setRegisterName(e.target.value)}
            width={260}
          />

          <AppButton variant="primary" size="md" type="submit">
            登録
          </AppButton>
        </FormBar>
      }
    >
      <ManagementTable>
        <DataGrid
          rows={O.filteredOrganizations}
          columns={[
            {
              header: "団体名",
              mobileLabel: "団体名",
              render: (o) => o.name ?? "未設定",
            },
            {
              header: "作成日",
              mobileLabel: "作成日",
              render: (o) => new Date(o.createdAt).toLocaleDateString(),
            },
            {
              header: "操作",
              mobileLabel: "操作",
              render: (o) => (
              <AppButton
                variant="danger"
                size="md"
                onClick={() => O.handleDelete(o.id)}
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
