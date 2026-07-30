"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "../Button/Button";
import DataGrid, { type Column } from "../DataGrid/DataGrid";
import DateInput from "../DateInput/DateInput";
import FormBar from "../FormBar/FormBar";
import Select from "../Select/Select";
import ManagementPanel, { ManagementTable } from "./ManagementPanel";

type ResultRow = {
  date: string;
  winner: string;
  loser: string;
  rateDiff: string;
};

const options = [
  { value: "dcsyhi", label: "dcsyhi" },
  { value: "piyopiyo", label: "piyopiyo" },
  { value: "moriuchi-flow", label: "流れは完全に森内" },
];

const columns: Column<ResultRow>[] = [
  { header: "日付", render: (row) => row.date },
  { header: "勝者", render: (row) => row.winner },
  { header: "敗者", render: (row) => row.loser },
  { header: "変動", render: (row) => row.rateDiff },
];

const rows: ResultRow[] = [
  { date: "2026-07-29", winner: "dcsyhi", loser: "piyopiyo", rateDiff: "+18" },
  { date: "2026-07-30", winner: "流れは完全に森内", loser: "dcsyhi", rateDiff: "+22" },
  { date: "2026-07-31", winner: "piyopiyo", loser: "流れは完全に森内", rateDiff: "+16" },
];

function FilterForm() {
  return (
    <FormBar>
      <DateInput defaultValue="2026-07-31" width={180} />
      <Select
        value={options[0]}
        onChange={() => undefined}
        options={options}
        placeholder="プレイヤー"
        width={240}
      />
      <Button variant="primary">検索</Button>
    </FormBar>
  );
}

type ManagementPanelPlaygroundProps = {
  title: string;
  initialTab: "search" | "register";
  initialOpen: boolean;
};

function ManagementPanelPlayground(props: ManagementPanelPlaygroundProps) {
  const [activeTab, setActiveTab] = useState<"search" | "register">(
    props.initialTab,
  );
  const [isFormOpen, setIsFormOpen] = useState(props.initialOpen);

  return (
    <ManagementPanel
      title={props.title}
      actions={<Button variant="primary">CSV 出力</Button>}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setIsFormOpen(true);
      }}
      isFormOpen={isFormOpen}
      onToggleOpen={() => setIsFormOpen((open) => !open)}
      searchContent={<FilterForm />}
      registerContent={<FilterForm />}
    >
      <ManagementTable>
        <DataGrid columns={columns} rows={rows} />
      </ManagementTable>
    </ManagementPanel>
  );
}

const meta = {
  title: "Components/ManagementPanel",
  component: ManagementPanelPlayground,
  args: {
    title: "対戦結果",
    initialTab: "search",
    initialOpen: true,
  },
  argTypes: {
    title: {
      control: "text",
    },
    initialTab: {
      control: "inline-radio",
      options: ["search", "register"],
    },
    initialOpen: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ManagementPanelPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
