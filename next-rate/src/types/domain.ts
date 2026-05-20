export type UserOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  systemRole: "owner" | "user"; // ← ★ 新仕様に統一
};
