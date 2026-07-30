import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "../Button/Button";
import PageHeader from "./PageHeader";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  args: {
    title: "対戦結果",
  },
  argTypes: {
    title: {
      control: "text",
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <PageHeader
      {...args}
      actions={<Button variant="primary">新規登録</Button>}
    />
  ),
};
