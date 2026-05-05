"use client";

/**
 * ============================================================================
 * useUser（団体管理ロジック）完全修正版
 * ・role（owner/admin）を扱えるように修正
 * ・UserClient.tsx と完全連動
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
  role: "owner" | "admin"; // ← ★ 追加
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
  const [registerOpt, setRegisterOpt] = useState<UserOption | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ★ role 選択用 state を追加
  const [roleOpt, setRoleOpt] = useState<UserOption | null>(null);

  /* --------------------------------------------------------------------------
   * 団体一覧取得
   * ------------------------------------------------------------------------ */
  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/private/user");
    const data = await res.json();
    setUsers(data);
    setFilteredUsers(data);
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
    if (!registerOpt || !registerOpt.__isNew__) {
      alert("新規団体名を入力してください");
      return;
    }
    if (!email) {
      alert("メールアドレスを入力してください");
      return;
    }
    if (!password) {
      alert("パスワードを入力してください");
      return;
    }
    if (!roleOpt) {
      alert("ロールを選択してください");
      return;
    }

    await fetch("/api/private/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerOpt.label,
        email,
        password,
        role: roleOpt.value, // ★ 追加
      }),
    });

    alert("登録が完了しました");
    await fetchUsers();
  }, [registerOpt, email, password, roleOpt, fetchUsers]);

  /* --------------------------------------------------------------------------
   * 検索
   * ------------------------------------------------------------------------ */
  const handleSearch = useCallback(() => {
    if (!searchOpt || searchOpt.__isNew__) {
      setFilteredUsers(users);
      return;
    }
    setFilteredUsers(users.filter((u) => u.id === searchOpt.value));
  }, [searchOpt, users]);

  /* --------------------------------------------------------------------------
   * 検索クリア
   * ------------------------------------------------------------------------ */
  const clearSearch = useCallback(() => {
    setSearchOpt(null);
    setFilteredUsers(users);
  }, [users]);

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("この団体を削除しますか？")) return;

      await fetch("/api/private/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      alert("削除が完了しました");
      await fetchUsers();
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

    registerOpt,
    setRegisterOpt,

    email,
    setEmail,

    password,
    setPassword,

    roleOpt,        // ★ 追加
    setRoleOpt,     // ★ 追加

    userOptions,

    handleSearch,
    clearSearch,
    handleRegister,
    handleDelete,

    currentUserId,
  };
}
