"use client";

import { useState, useCallback } from "react";
import { parseApiResponse } from "@/lib/fetchJson";
import { useManagementState } from "@/hooks/useManagementState";

export type UserOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  role: "owner" | "admin" | "editer" | "viewer";
  organizationId?: string | null;
};

export function useUser(
  currentUserId: string,
  currentUserRole: "owner" | "admin",
  currentOrganizationId: string
) {
  const management = useManagementState<"search" | "register">("search");
  const { mounted, activeTab, setActiveTab, lastAction, setLastAction, initialize } = management;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagedUser[]>([]);
  const [organizations, setOrganizations] = useState<{
    id: string;
    name: string | null;
  }[]>([]);

  const [searchOpt, setSearchOpt] = useState<UserOption | null>(null);
  const [registerName, setRegisterName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [roleOpt, setRoleOpt] = useState<UserOption | null>(null);
  const [organizationOpt, setOrganizationOpt] = useState<UserOption | null>(
    currentUserRole === "admin"
      ? { value: currentOrganizationId, label: "自団体" }
      : null
  );

  /* --------------------------------------------------------------------------
   * 団体一覧取得
   * ------------------------------------------------------------------------ */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/private/user");
      const data = await parseApiResponse<ManagedUser[]>(res);
      setUsers(data);
      setFilteredUsers(data);
    } catch {
      setLastAction("fetch-error");
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch("/api/private/organization");
      const data = await parseApiResponse<{ id: string; name: string | null }[]>(res);
      setOrganizations(data);
    } catch {
      setLastAction("fetch-error");
    }
  }, []);

  /* --------------------------------------------------------------------------
   * 初期化
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    initialize();
    await Promise.all([fetchUsers(), fetchOrganizations()]);
  }, [fetchUsers, fetchOrganizations, initialize]);

  /* --------------------------------------------------------------------------
   * オプション
   * ------------------------------------------------------------------------ */
  const userOptions: UserOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? "(名前なし)",
  }));

  const organizationOptions: UserOption[] = organizations.map((org) => ({
    value: org.id,
    label: org.name ?? "(名前なし)",
  }));

  const roleOptions: UserOption[] =
    currentUserRole === "owner"
      ? [
          { label: "owner", value: "owner" },
          { label: "admin", value: "admin" },
          { label: "editer", value: "editer" },
          { label: "viewer", value: "viewer" },
        ]
      : [
          { label: "editer", value: "editer" },
          { label: "viewer", value: "viewer" },
        ];

  /* --------------------------------------------------------------------------
   * 新規登録
   * ------------------------------------------------------------------------ */
  const handleRegister = useCallback(async () => {
    if (!registerName.trim()) {
      setLastAction("register-error");
      return;
    }
    if (!email) {
      setLastAction("register-error");
      return;
    }
    if (!password) {
      setLastAction("register-error");
      return;
    }
    if (!roleOpt) {
      setLastAction("register-error");
      return;
    }

    if (currentUserRole === "owner" && roleOpt.value !== "owner" && !organizationOpt) {
      setLastAction("register-error");
      return;
    }

    try {
      const res = await fetch("/api/private/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName.trim(),
          email,
          password,
          role: roleOpt.value,
          organizationId:
            currentUserRole === "admin"
              ? currentOrganizationId
              : organizationOpt?.value ?? null,
        }),
      });
      await parseApiResponse(res);

      setRegisterName("");
      setEmail("");
      setPassword("");
      setRoleOpt(null);
      setOrganizationOpt(null);

      setLastAction("register-success");
      await fetchUsers();
    } catch {
      setLastAction("register-error");
    }
  }, [registerName, email, password, roleOpt, organizationOpt, fetchUsers, currentUserRole, currentOrganizationId]);

  /* --------------------------------------------------------------------------
   * 検索
   * ------------------------------------------------------------------------ */
  const handleSearch = useCallback(() => {
    if (!searchOpt || searchOpt.__isNew__) {
      setFilteredUsers(users);
      setLastAction("search");
      return;
    }

    setFilteredUsers(users.filter((u) => u.id === searchOpt.value));
    setLastAction("search");
  }, [searchOpt, users]);

  /* --------------------------------------------------------------------------
   * 検索クリア
   * ------------------------------------------------------------------------ */
  const clearSearch = useCallback(() => {
    setSearchOpt(null);
    setFilteredUsers(users);
    setLastAction("search");
  }, [users]);

  const getOrganizationLabel = (organizationId?: string | null) => {
    if (!organizationId) return "-";
    return organizations.find((org) => org.id === organizationId)?.name ?? "(削除済み団体)";
  };

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("この団体を削除しますか？")) return;

      try {
        const res = await fetch("/api/private/user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        await parseApiResponse(res);

        setLastAction("delete-success");
        await fetchUsers();
      } catch {
        setLastAction("delete-error");
      }
    },
    [fetchUsers]
  );

  /* --------------------------------------------------------------------------
   * 返却
   * ------------------------------------------------------------------------ */
  return {
    mounted,
    init,

    users,
    filteredUsers,
    organizations,

    activeTab,
    setActiveTab,

    searchOpt,
    setSearchOpt,

    registerName,
    setRegisterName,

    email,
    setEmail,

    password,
    setPassword,

    roleOpt,
    setRoleOpt,
    organizationOpt,
    setOrganizationOpt,

    userOptions,
    organizationOptions,

    handleSearch,
    clearSearch,
    handleRegister,
    handleDelete,

    lastAction, // ★ 追加：UserClient でトースト通知に使う
    currentUserId,
    getOrganizationLabel,
    roleOptions,
  };
}
