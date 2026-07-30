import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "検索",
    variant: "secondary",
    size: "md",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
    onClick: {
      action: "clicked",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <Button variant="secondary">検索</Button>
      <Button variant="secondary">クリア</Button>
      <Button variant="secondary">次の日</Button>
      <Button variant="secondary">前の日</Button>
      <Button variant="primary">登録</Button>
      <Button variant="primary">新規登録</Button>
      <Button variant="primary">CSV 出力</Button>
      <Button variant="danger">削除</Button>
    </div>
  ),
};
