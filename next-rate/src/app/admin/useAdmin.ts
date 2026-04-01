"use client";

import { useState } from "react";

export type AdminOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
};

export function useAdmin(currentUserId: string) {
  /* ==========================================================================
   * 状態管理
   * ======================================================================== */
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);

  const [activeTab, setActiveTab] = useState<"search" | "register">("search");

  const [searchOpt, setSearchOpt] = useState<AdminOption | null>(null);
  const [registerOpt, setRegisterOpt] = useState<AdminOption | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mounted, setMounted] = useState(false);

  /* ==========================================================================
   * 初期化
   * ======================================================================== */
  const init = async () => {
    setMounted(true);
    await fetchUsers();
  };

  /* ==========================================================================
   * 管理者一覧取得
   * ======================================================================== */
  const fetchUsers = async () => {
    const res = await fetch("/api/private/admin");
    const data = await res.json();

    setUsers(data);
    setFilteredUsers(data);
  };

  /* ==========================================================================
   * セレクトボックス用オプション
   * ======================================================================== */
  const adminOptions: AdminOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? "(名前なし)",
  }));

  /* ==========================================================================
   * API 呼び出し
   * ======================================================================== */
  const postAdmin = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const res = await fetch("/api/private/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const deleteAdmin = async (id: string) => {
    const res = await fetch("/api/private/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return res.json();
  };

  /* ==========================================================================
   * 新規登録
   * ======================================================================== */
  const handleRegister = async () => {
    if (!registerOpt || !registerOpt.__isNew__) {
      alert("新規管理者の名前を入力してください");
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

    await postAdmin({
      name: registerOpt.label,
      email,
      password,
    });

    alert("登録が完了しました");
    await fetchUsers();
  };

  /* ==========================================================================
   * 検索（クライアントサイドフィルタ）
   * ======================================================================== */
  const handleSearch = () => {
    if (!searchOpt || searchOpt.__isNew__) {
      setFilteredUsers(users);
      return;
    }

    setFilteredUsers(users.filter((u) => u.id === searchOpt.value));
  };

  /* ==========================================================================
   * 検索条件クリア
   * ======================================================================== */
  const clearSearch = () => {
    setSearchOpt(null);
    setFilteredUsers(users);
  };

  /* ==========================================================================
   * 削除
   * ======================================================================== */
  const handleDelete = async (id: string) => {
    if (!confirm("この管理者を削除しますか？")) return;

    await deleteAdmin(id);

    alert("削除が完了しました");
    await fetchUsers();
  };

  /* ==========================================================================
   * 返却
   * ======================================================================== */
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

    adminOptions,

    handleSearch,
    clearSearch,
    handleRegister,
    handleDelete,

    currentUserId,
  };
}