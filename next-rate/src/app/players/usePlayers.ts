"use client";

/**
 * ============================================================================
 * 【フック名称】
 * usePlayers（対局者管理ロジック）
 *
 * 【機能概要】
 * ・団体（userId）に紐づくプレイヤー一覧の取得・登録・削除を行う。
 *
 * 【設計方針】
 * ① API は userId パラメータ方式
 * ② admin → 自団体固定
 * ③ owner → 団体選択 UI で userId を切り替え
 * ④ init / fetchPlayers / handleRegister / handleDelete を useCallback 化
 * ============================================================================
 */

import { useState, useCallback } from "react";
import type { Player } from "@prisma/client";

export function usePlayers(userId: string) {
  /* --------------------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------------------ */
  const [mounted, setMounted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  const [name, setName] = useState("");
  const [initialRate, setInitialRate] = useState("1500");

  /* --------------------------------------------------------------------------
   * プレイヤー一覧取得
   * ------------------------------------------------------------------------ */
  const fetchPlayers = useCallback(async () => {
    const res = await fetch(`/api/private/player?userId=${userId}`);
    const data = await res.json();
    setPlayers(data);
  }, [userId]);

  /* --------------------------------------------------------------------------
   * 初期化（useCallback 化）
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    setMounted(true);
    await fetchPlayers();
  }, [fetchPlayers]);

  /* --------------------------------------------------------------------------
   * 登録
   * ------------------------------------------------------------------------ */
  const handleRegister = useCallback(async () => {
    if (!name) {
      alert("プレイヤー名を入力してください");
      return;
    }

    await fetch("/api/private/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        initialRate: Number(initialRate),
        userId,
      }),
    });

    alert("登録が完了しました");
    setName("");
    setInitialRate("1500");
    await fetchPlayers();
  }, [name, initialRate, userId, fetchPlayers]);

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("このプレイヤーを削除しますか？")) return;

      await fetch("/api/private/player", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      });

      alert("削除が完了しました");
      await fetchPlayers();
    },
    [userId, fetchPlayers]
  );

  /* --------------------------------------------------------------------------
   * 返却
   * ------------------------------------------------------------------------ */
  return {
    mounted,
    init,

    players,

    name,
    setName,
    initialRate,
    setInitialRate,

    handleRegister,
    handleDelete,
  };
}
