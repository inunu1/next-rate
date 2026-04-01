"use client";

import { useState } from "react";
import type { Player } from "@prisma/client";

export type PlayerOption = {
  value: string;
  label: string;
  __isNew__?: boolean;
};

export function usePlayers(currentUserId: string) {
  /* ==========================================================================
   * 状態管理
   * ======================================================================== */
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);

  const [activeTab, setActiveTab] = useState<"search" | "register">("search");

  const [searchOpt, setSearchOpt] = useState<PlayerOption | null>(null);
  const [registerOpt, setRegisterOpt] = useState<PlayerOption | null>(null);
  const [initialRate, setInitialRate] = useState("");

  const [mounted, setMounted] = useState(false);

  /* ==========================================================================
   * 初期化
   * ======================================================================== */
  const init = async () => {
    setMounted(true);
    await fetchPlayers();
  };

  /* ==========================================================================
   * プレイヤー一覧取得
   * ======================================================================== */
  const fetchPlayers = async () => {
    const res = await fetch("/api/private/player");
    const data = await res.json();

    setPlayers(data);
    setFilteredPlayers(data);
  };

  /* ==========================================================================
   * セレクトボックス用オプション
   * ======================================================================== */
  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* ==========================================================================
   * API 呼び出し
   * ======================================================================== */
  const postPlayer = async (data: { name: string; initialRate: number }) => {
    const res = await fetch("/api/private/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const deletePlayer = async (id: string) => {
    const res = await fetch("/api/private/player", {
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
      alert("新規プレイヤー名を入力してください");
      return;
    }
    if (!initialRate) {
      alert("初期レートを入力してください");
      return;
    }

    await postPlayer({
      name: registerOpt.label,
      initialRate: Number(initialRate),
    });

    alert("登録が完了しました");
    await fetchPlayers();
  };

  /* ==========================================================================
   * 検索（クライアントサイドフィルタ）
   * ======================================================================== */
  const handleSearch = () => {
    if (!searchOpt || searchOpt.__isNew__) {
      setFilteredPlayers(players);
      return;
    }

    setFilteredPlayers(players.filter((p) => p.id === searchOpt.value));
  };

  /* ==========================================================================
   * 検索条件クリア
   * ======================================================================== */
  const clearSearch = () => {
    setSearchOpt(null);
    setFilteredPlayers(players);
  };

  /* ==========================================================================
   * 論理削除（出禁）
   * ======================================================================== */
  const handleSoftDelete = async (id: string) => {
    if (!confirm("このプレイヤーを出禁にしますか？")) return;

    await deletePlayer(id);

    alert("削除が完了しました");
    await fetchPlayers();
  };

  /* ==========================================================================
   * 返却
   * ======================================================================== */
  return {
    mounted,
    init,

    players,
    filteredPlayers,

    activeTab,
    setActiveTab,

    searchOpt,
    setSearchOpt,

    registerOpt,
    setRegisterOpt,

    initialRate,
    setInitialRate,

    playerOptions,

    handleSearch,
    clearSearch,
    handleRegister,
    handleSoftDelete,

    currentUserId,
  };
}