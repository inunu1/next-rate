import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DataGrid, { type Column } from "./DataGrid";

type ResultRow = {
  date: string;
  winner: string;
  loser: string;
  rateDiff: string;
};

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

const meta = {
  title: "Components/DataGrid",
  component: DataGrid<ResultRow>,
  args: {
    columns,
    rows,
  },
} satisfies Meta<typeof DataGrid<ResultRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
