"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@/components/Button/Button";
import DataGrid, { type Column } from "@/components/DataGrid/DataGrid";
import DateInput from "@/components/DateInput/DateInput";
import FormBar from "@/components/FormBar/FormBar";
import ManagementPanel, {
  ManagementTable,
} from "@/components/ManagementPanel/ManagementPanel";
import Select, { type Option } from "@/components/Select/Select";

const meta = {
  title: "Screens/Management",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const players: Option[] = [
  { value: "dcsyhi", label: "dcsyhi" },
  { value: "piyopiyo", label: "piyopiyo" },
  { value: "moriuchi-flow", label: "流れは完全に森内" },
];

const organizations: Option[] = [
  { value: "island-lab", label: "island研" },
  { value: "next-rate-lab", label: "ネクストレート研" },
];

const roles: Option[] = [
  { value: "owner", label: "owner" },
  { value: "admin", label: "admin" },
  { value: "editer", label: "editer" },
  { value: "viewer", label: "viewer" },
];

function BackLink() {
  return (
    <a href="/dashboard" style={{ color: "var(--color-text-muted)" }}>
      ← ダッシュボードへ戻る
    </a>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-app)",
        color: "var(--color-text-main)",
        paddingTop: 24,
      }}
    >
      {children}
    </div>
  );
}

function SelectField({
  options,
  placeholder,
  width = 240,
}: {
  options: Option[];
  placeholder: string;
  width?: string | number;
}) {
  const [value, setValue] = useState<Option | null>(null);

  return (
    <Select
      value={value}
      onChange={setValue}
      options={options}
      placeholder={placeholder}
      width={width}
    />
  );
}

type MatchResultRow = {
  date: string;
  round: string;
  winner: string;
  loser: string;
};

const matchResultRows: MatchResultRow[] = [
  {
    date: "2026/07/29",
    round: "R1",
    winner: "dcsyhi (1520)",
    loser: "piyopiyo (1488)",
  },
  {
    date: "2026/07/30",
    round: "R2",
    winner: "流れは完全に森内 (1564)",
    loser: "dcsyhi (1538)",
  },
  {
    date: "2026/07/31",
    round: "R1",
    winner: "piyopiyo (1504)",
    loser: "流れは完全に森内 (1542)",
  },
];

const matchResultColumns: Column<MatchResultRow>[] = [
  { header: "日付", mobileLabel: "日付", render: (row) => row.date },
  { header: "R", mobileLabel: "ラウンド", render: (row) => row.round },
  { header: "勝者（開始時）", mobileLabel: "勝者", render: (row) => row.winner },
  { header: "敗者（開始時）", mobileLabel: "敗者", render: (row) => row.loser },
  {
    header: "操作",
    mobileLabel: "操作",
    render: () => (
      <Button variant="danger" size="md">
        削除
      </Button>
    ),
  },
];

type PlayerRow = {
  name: string;
  initialRate: number;
  currentRate: number;
};

const playerRows: PlayerRow[] = [
  { name: "dcsyhi", initialRate: 1500, currentRate: 1538 },
  { name: "piyopiyo", initialRate: 1500, currentRate: 1504 },
  { name: "流れは完全に森内", initialRate: 1500, currentRate: 1542 },
];

const playerColumns: Column<PlayerRow>[] = [
  { header: "名前", mobileLabel: "名前", render: (row) => row.name },
  {
    header: "初期レート",
    mobileLabel: "初期レート",
    render: (row) => row.initialRate,
  },
  {
    header: "現在レート",
    mobileLabel: "現在レート",
    render: (row) => row.currentRate,
  },
  {
    header: "操作",
    mobileLabel: "操作",
    render: () => (
      <Button variant="danger" size="md">
        削除
      </Button>
    ),
  },
];

type UserRow = {
  email: string;
  name: string;
  role: string;
};

const userRows: UserRow[] = [
  { email: "owner@example.com", name: "dcsyhi", role: "owner" },
  { email: "admin@example.com", name: "piyopiyo", role: "admin" },
  { email: "viewer@example.com", name: "流れは完全に森内", role: "viewer" },
];

const userColumns: Column<UserRow>[] = [
  { header: "Email", mobileLabel: "Email", render: (row) => row.email },
  { header: "名前", mobileLabel: "名前", render: (row) => row.name },
  { header: "ロール", mobileLabel: "ロール", render: (row) => row.role },
  {
    header: "操作",
    mobileLabel: "操作",
    render: () => (
      <Button variant="danger" size="md">
        削除
      </Button>
    ),
  },
];

type OrganizationRow = {
  name: string;
  createdAt: string;
};

const organizationRows: OrganizationRow[] = [
  { name: "island研", createdAt: "2026/07/01" },
  { name: "ネクストレート研", createdAt: "2026/07/15" },
];

const organizationColumns: Column<OrganizationRow>[] = [
  { header: "団体名", mobileLabel: "団体名", render: (row) => row.name },
  { header: "作成日", mobileLabel: "作成日", render: (row) => row.createdAt },
  {
    header: "操作",
    mobileLabel: "操作",
    render: () => (
      <Button variant="danger" size="md">
        削除
      </Button>
    ),
  },
];

function ResultsScreen() {
  const [activeTab, setActiveTab] = useState<"search" | "register">("search");
  const [isFormOpen, setIsFormOpen] = useState(true);

  return (
    <ManagementPanel
      title="対局結果管理"
      actions={<BackLink />}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((open) => !open)}
      searchContent={
        <FormBar>
          <SelectField options={players} placeholder="プレイヤーで絞り込み" />
          <DateInput defaultValue="2026-07-31" width={180} />
          <Button variant="secondary">検索</Button>
          <Button variant="secondary">クリア</Button>
        </FormBar>
      }
      registerContent={
        <FormBar>
          <SelectField options={players} placeholder="勝者" />
          <SelectField options={players} placeholder="敗者" />
          <DateInput defaultValue="2026-07-31" width={180} />
          <SelectField
            options={[
              { value: "1", label: "第1ラウンド" },
              { value: "2", label: "第2ラウンド" },
            ]}
            placeholder="ラウンド"
            width={180}
          />
          <Button variant="primary">登録</Button>
        </FormBar>
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Button variant="secondary">次の日</Button>
        <strong>2026/07/31</strong>
        <Button variant="secondary">前の日</Button>
      </div>
      <ManagementTable>
        <DataGrid columns={matchResultColumns} rows={matchResultRows} />
      </ManagementTable>
    </ManagementPanel>
  );
}

function PlayersScreen() {
  const [activeTab, setActiveTab] = useState<"search" | "register">("register");
  const [isFormOpen, setIsFormOpen] = useState(true);

  return (
    <ManagementPanel
      title="対局者管理"
      actions={<BackLink />}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((open) => !open)}
      searchContent={
        <FormBar>
          <SelectField options={players} placeholder="プレイヤーで絞り込み" />
          <Button variant="secondary">検索</Button>
          <Button variant="secondary">クリア</Button>
        </FormBar>
      }
      registerContent={
        <FormBar>
          <DateInput type="text" placeholder="新規プレイヤー名" width={260} />
          <DateInput type="number" placeholder="初期レート" width={180} />
          <Button variant="primary">登録</Button>
        </FormBar>
      }
    >
      <ManagementTable>
        <DataGrid columns={playerColumns} rows={playerRows} />
      </ManagementTable>
    </ManagementPanel>
  );
}

function UsersScreen() {
  const [activeTab, setActiveTab] = useState<"search" | "register">("register");
  const [isFormOpen, setIsFormOpen] = useState(true);

  return (
    <ManagementPanel
      title="ユーザー管理"
      actions={<BackLink />}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((open) => !open)}
      searchContent={
        <FormBar>
          <SelectField
            options={userRows.map((user) => ({
              value: user.email,
              label: user.name,
            }))}
            placeholder="ユーザー名で絞り込み"
          />
          <Button variant="secondary">検索</Button>
          <Button variant="secondary">クリア</Button>
        </FormBar>
      }
      registerContent={
        <FormBar>
          <DateInput type="text" placeholder="新規ユーザー名" width={260} />
          <DateInput type="email" placeholder="メールアドレス" width={260} />
          <DateInput type="password" placeholder="パスワード" width={260} />
          <SelectField options={roles} placeholder="ロールを選択" width={180} />
          <SelectField
            options={organizations}
            placeholder="所属団体を選択"
            width={220}
          />
          <Button variant="primary">新規登録</Button>
        </FormBar>
      }
    >
      <ManagementTable>
        <DataGrid columns={userColumns} rows={userRows} />
      </ManagementTable>
    </ManagementPanel>
  );
}

function OrganizationsScreen() {
  const [activeTab, setActiveTab] = useState<"search" | "register">("search");
  const [isFormOpen, setIsFormOpen] = useState(true);

  return (
    <ManagementPanel
      title="団体管理"
      actions={<BackLink />}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((open) => !open)}
      searchContent={
        <FormBar>
          <SelectField options={organizations} placeholder="団体名で絞り込み" />
          <Button variant="secondary">検索</Button>
          <Button variant="secondary">クリア</Button>
        </FormBar>
      }
      registerContent={
        <FormBar>
          <DateInput type="text" placeholder="新規団体名" width={260} />
          <Button variant="primary">登録</Button>
        </FormBar>
      }
    >
      <ManagementTable>
        <DataGrid columns={organizationColumns} rows={organizationRows} />
      </ManagementTable>
    </ManagementPanel>
  );
}

export const MatchResults: Story = {
  render: () => (
    <ScreenShell>
      <ResultsScreen />
    </ScreenShell>
  ),
};

export const PlayerRateRegistration: Story = {
  render: () => (
    <ScreenShell>
      <PlayersScreen />
    </ScreenShell>
  ),
};

export const UserManagement: Story = {
  render: () => (
    <ScreenShell>
      <UsersScreen />
    </ScreenShell>
  ),
};

export const OrganizationManagement: Story = {
  render: () => (
    <ScreenShell>
      <OrganizationsScreen />
    </ScreenShell>
  ),
};
