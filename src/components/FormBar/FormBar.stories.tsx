import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "../Button/Button";
import DateInput from "../DateInput/DateInput";
import Select from "../Select/Select";
import FormBar from "./FormBar";

const options = [
  { value: "dcsyhi", label: "dcsyhi" },
  { value: "piyopiyo", label: "piyopiyo" },
  { value: "moriuchi-flow", label: "流れは完全に森内" },
];

const meta = {
  title: "Components/FormBar",
  component: FormBar,
  args: {
    as: "div",
    open: true,
  },
  argTypes: {
    as: {
      control: "inline-radio",
      options: ["div", "form"],
    },
    open: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof FormBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <FormBar {...args}>
      <DateInput defaultValue="2026-07-31" width={180} />
      <Select
        value={options[0]}
        onChange={() => undefined}
        options={options}
        placeholder="プレイヤー"
        width={240}
      />
      <Button variant="primary">検索</Button>
      <Button>クリア</Button>
    </FormBar>
  ),
};
