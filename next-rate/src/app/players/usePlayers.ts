"use client";

/**
 * ============================================================================
 * 【フック名称】
 * usePlayers（対局者管理ロジック）
 *
 * 【機能概要】
 * ・団体（userId）に紐づくプレイヤー情報の取得・検索・登録・削除を行う。
 *
 * 【設計方針】
 * ① API は userId パラメータ方式を採用するため、
 *    本フックは常に currentUserId（操作対象団体）を受け取る。
 *
 * ② admin（団体オーナー）
 *      - currentUserId はセッションの user.id
 *      - API 側で強制的に自団体に制限される
 *
 * ③ owner（SaaS 運営者）
 *      - 画面側で団体選択 UI により currentUserId を切り替える
 *      - API に userId を渡すことで任意団体を操作可能
 *
 * ④ Select コンポーネントは Option 型を使用するため、
 *    searchOpt / registerOpt は Option | null を保持する。
 *
 * 【提供機能】
 * ・プレイヤー一覧取得
 * ・プレイヤー検索（クライアントサイド）
 * ・プレイヤー新規登録
 * ・プレイヤー論理削除（出禁）
 *
 * 【例外処理方針】
 * ・API エラーは呼び出し元でハンドリング
 * ・本フックでは最低限の alert のみ実施
 * ============================================================================
 */

import { useState } from "react";
import type { Player } from "@prisma/client";

/* Select 用 Option 型 */
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
   * プレイヤー一覧取得（userId パラメータ方式）
   * ======================================================================== */
  const fetchPlayers = async () => {
    const res = await fetch(`/api/private/player?userId=${currentUserId}`);
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
   * API 呼び出し（POST / DELETE）
   * ======================================================================== */
  const postPlayer = async (data: { name: string; initialRate: number }) => {
    const res = await fetch("/api/private/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        userId: currentUserId, // ★ owner/admin 共通で userId を付与
      }),
    });
    return res.json();
  };

  const deletePlayer = async (id: string) => {
    const res = await fetch("/api/private/player", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        userId: currentUserId, // ★ owner/admin 共通で userId を付与
      }),
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
