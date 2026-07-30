"use client";

import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Select, { type Option } from "./Select";

const options: Option[] = [
  { value: "dcsyhi", label: "dcsyhi" },
  { value: "piyopiyo", label: "piyopiyo" },
  { value: "moriuchi-flow", label: "流れは完全に森内" },
];

type SelectPlaygroundProps = {
  selectedValue: string;
  placeholder: string;
  width: number;
  mode: "select" | "creatable";
  searchable: boolean;
};

function SelectPlayground(props: SelectPlaygroundProps) {
  const { selectedValue, ...selectProps } = props;
  const initialValue = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? null,
    [selectedValue],
  );
  const [value, setValue] = useState<Option | null>(initialValue);

  return (
    <Select
      {...selectProps}
      value={value}
      onChange={setValue}
      options={options}
    />
  );
}

const meta = {
  title: "Components/Select",
  component: SelectPlayground,
  args: {
    selectedValue: "dcsyhi",
    placeholder: "プレイヤーを選択",
    width: 260,
    mode: "select",
    searchable: true,
  },
  argTypes: {
    selectedValue: {
      control: "select",
      options: options.map((option) => option.value),
    },
    width: {
      control: "number",
    },
    mode: {
      control: "inline-radio",
      options: ["select", "creatable"],
    },
    searchable: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof SelectPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
