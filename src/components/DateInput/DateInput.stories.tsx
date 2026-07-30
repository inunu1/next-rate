import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DateInput from "./DateInput";

const meta = {
  title: "Components/DateInput",
  component: DateInput,
  args: {
    defaultValue: "2026-07-31",
    width: 180,
    disabled: false,
  },
  argTypes: {
    width: {
      control: "number",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
