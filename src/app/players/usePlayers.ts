"use client";

/**
 * ============================================================================
 * usePlayers（対局者管理ロジック）完全修正版
 * ・トースト通知用 lastAction を追加
 * ・alert() を全廃し、UI 側で toast を出せる構造に統一
 * ・User / Results と同じ設計思想で責務分離
 * ============================================================================
 */

import { useState, useCallback } from "react";
import type { Player } from "@prisma/client";
import { parseApiResponse } from "@/lib/fetchJson";

export type PlayerOption = { value: string; label: string };

export function usePlayers(userId: string) {
  /* --------------------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------------------ */
  const [mounted, setMounted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "register">("search");
  const [playerOpt, setPlayerOpt] = useState<PlayerOption | null>(null);

  const [name, setName] = useState("");
  const [initialRate, setInitialRate] = useState("1500");

  // ★ トースト通知用
  const [lastAction, setLastAction] = useState<string | null>(null);

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* --------------------------------------------------------------------------
   * プレイヤー一覧取得
   * ------------------------------------------------------------------------ */
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/private/player?userId=${userId}`);
      const data = await parseApiResponse<Player[]>(res);
      setPlayers(data);
    } catch {
      setLastAction("fetch-error");
    }
  }, [userId]);

  /* --------------------------------------------------------------------------
   * 初期化
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    setMounted(true);
    await fetchPlayers();
  }, [fetchPlayers]);

  /* --------------------------------------------------------------------------
   * 検索（Players は playerOpt のみでフィルタ）
   * ------------------------------------------------------------------------ */
  const handleSearch = useCallback(() => {
    // 実際の検索処理は PlayersClient 側の useMemo に委譲
    setLastAction("search");
  }, []);

  /* --------------------------------------------------------------------------
   * 登録
   * ------------------------------------------------------------------------ */
  const handleRegister = useCallback(async () => {
    if (!name) {
      setLastAction("register-error");
      return;
    }

    try {
      const res = await fetch("/api/private/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          initialRate: Number(initialRate),
          userId,
        }),
      });

      await parseApiResponse(res);

      setName("");
      setInitialRate("1500");

      setLastAction("register-success");
      await fetchPlayers();
    } catch {
      setLastAction("register-error");
    }
  }, [name, initialRate, userId, fetchPlayers]);

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("このプレイヤーを削除しますか？")) return;

      try {
        const res = await fetch("/api/private/player", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, userId }),
        });

        await parseApiResponse(res);

        setLastAction("delete-success");
        await fetchPlayers();
      } catch {
        setLastAction("delete-error");
      }
    },
    [userId, fetchPlayers]
  );

  /* --------------------------------------------------------------------------
   * 返却
   * ------------------------------------------------------------------------ */
  return {
    mounted,
    init,

    activeTab,
    setActiveTab,

    playerOpt,
    setPlayerOpt,
    playerOptions,
    players,

    name,
    setName,
    initialRate,
    setInitialRate,

    handleSearch,
    handleRegister,
    handleDelete,

    lastAction, // ★ トースト通知用
  };
}
