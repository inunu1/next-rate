"use client";

import { useState, useCallback } from "react";
import { parseApiResponse } from "@/lib/fetchJson";
import type { UserOption, ManagedUser } from "@/types/domain";

export function useUser(currentUserId: string) {
  const [mounted, setMounted] = useState(false);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagedUser[]>([]);

  const [activeTab, setActiveTab] = useState<"search" | "register">("search");

  const [searchOpt, setSearchOpt] = useState<UserOption | null>(null);
  const [registerName, setRegisterName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [roleOpt, setRoleOpt] = useState<UserOption | null>(null);

  const [lastAction, setLastAction] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
   * ユーザー一覧取得
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

  /* --------------------------------------------------------------------------
   * 初期化
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    setMounted(true);
    await fetchUsers();
  }, [fetchUsers]);

  /* --------------------------------------------------------------------------
   * セレクト用オプション
   * ------------------------------------------------------------------------ */
  const userOptions: UserOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? "(名前なし)",
  }));

  /* --------------------------------------------------------------------------
   * 新規登録
   * ------------------------------------------------------------------------ */
  const handleRegister = useCallback(async () => {
    if (!registerName.trim() || !email || !password || !roleOpt) {
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
          systemRole: roleOpt.value, // ← ★ 新仕様
        }),
      });

      await parseApiResponse(res);

      setRegisterName("");
      setEmail("");
      setPassword("");
      setRoleOpt(null);

      setLastAction("register-success");
      await fetchUsers();
    } catch {
      setLastAction("register-error");
    }
  }, [registerName, email, password, roleOpt, fetchUsers]);

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

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("このユーザーを削除しますか？")) return;

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

  return {
    mounted,
    init,

    users,
    filteredUsers,

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

    userOptions,

    handleSearch,
    clearSearch,
    handleRegister,
    handleDelete,

    lastAction,
    currentUserId,
  };
}
