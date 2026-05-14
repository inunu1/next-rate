"use client";

/**
 * ============================================================================
 * useUser（団体管理ロジック）完全修正版
 * ・role（owner/admin）対応
 * ・UserClient.tsx のトースト通知と完全連動
 * ・lastAction により UI 側で成功/失敗を判定可能
 * ============================================================================
 */

import { useState, useCallback } from "react";

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

export function useUser(currentUserId: string) {
  /* --------------------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------------------ */
  const [mounted, setMounted] = useState(false);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagedUser[]>([]);

  const [activeTab, setActiveTab] = useState<"search" | "register">("search");

  const [searchOpt, setSearchOpt] = useState<UserOption | null>(null);
  const [registerName, setRegisterName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [roleOpt, setRoleOpt] = useState<UserOption | null>(null);

  // ★ トースト通知用のアクション状態
  const [lastAction, setLastAction] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
   * 団体一覧取得
   * ------------------------------------------------------------------------ */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/private/user");
      const data = await res.json();
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
   * オプション
   * ------------------------------------------------------------------------ */
  const userOptions: UserOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? "(名前なし)",
  }));

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

    try {
      await fetch("/api/private/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName.trim(),
          email,
          password,
          role: roleOpt.value,
        }),
      });

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
      if (!confirm("この団体を削除しますか？")) return;

      try {
        await fetch("/api/private/user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

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

    lastAction, // ★ 追加：UserClient でトースト通知に使う
    currentUserId,
  };
}
