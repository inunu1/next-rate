export type UserOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  role: "owner" | "admin";
};
