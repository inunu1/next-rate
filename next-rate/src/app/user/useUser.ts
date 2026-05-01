"use client";

/**
 * ============================================================================
 * 【フック名称】
 * useUser（団体管理ロジック）
 *
 * 【機能概要】
 * ・SaaS 運営者（owner）が団体（User）を管理するためのロジック。
 * ・団体の検索・新規登録・削除を行う。
 *
 * 【設計方針】
 * ① admin（団体オーナー）は団体管理を行わないため、このフックは owner 専用。
 *
 * ② Select コンポーネントは Option 型を使用するため、
 *    searchOpt / registerOpt は Option | null を保持する。
 *
 * ③ API は /api/private/user を使用し、団体（User）を CRUD する。
 *
 * 【非責務】
 * ・認証チェック（Server Component 側で実施）
 * ・対局者・対局結果の管理（別フックで実施）
 * ============================================================================
 */

import { useState } from "react";

export type UserOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
};

export function useUser(currentUserId: string) {
  /* ==========================================================================
   * 状態管理
   * ======================================================================== */
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagedUser[]>([]);

  const [activeTab, setActiveTab] = useState<"search" | "register">("search");

  const [searchOpt, setSearchOpt] = useState<UserOption | null>(null);
  const [registerOpt, setRegisterOpt] = useState<UserOption | null>(null);

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
   * 団体一覧取得
   * ======================================================================== */
  const fetchUsers = async () => {
    const res = await fetch("/api/private/user");
    const data = await res.json();

    setUsers(data);
    setFilteredUsers(data);
  };

  /* ==========================================================================
   * セレクトボックス用オプション
   * ======================================================================== */
  const userOptions: UserOption[] = users.map((u) => ({
    value: u.id,
    label: u.name ?? "(名前なし)",
  }));

  /* ==========================================================================
   * API 呼び出し
   * ======================================================================== */
  const postUser = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const res = await fetch("/api/private/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const deleteUser = async (id: string) => {
    const res = await fetch("/api/private/user", {
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

    await postUser({
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
    if (!confirm("この団体を削除しますか？")) return;

    await deleteUser(id);

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

    userOptions,

    handleSearch,
    clearSearch,
    handleRegister,
    handleDelete,

    currentUserId,
  };
}
