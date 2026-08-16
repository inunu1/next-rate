"use client";

import { useState, useCallback } from "react";
import type { Player } from "@prisma/client";
import { requestJson, runApiAction } from "@/lib/apiAction";
import { useManagementState } from "@/hooks/useManagementState";

export type PlayerOption = { value: string; label: string };

export function usePlayers(organizationId: string) {
  const management = useManagementState<"search" | "register">("search");
  const { mounted, activeTab, setActiveTab, lastAction, setLastAction, initialize } = management;

  const [players, setPlayers] = useState<Player[]>([]);
  const [playerOpt, setPlayerOpt] = useState<PlayerOption | null>(null);

  const [name, setName] = useState("");
  const [initialRate, setInitialRate] = useState("1500");

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* --------------------------------------------------------------------------
   * プレイヤー一覧取得
   * ------------------------------------------------------------------------ */
  const fetchPlayers = useCallback(async () => {
    const data = await runApiAction(
      () => requestJson<Player[]>(`/api/private/player?organizationId=${organizationId}`),
      setLastAction,
      null,
      "fetch-error"
    );

    if (data) {
      setPlayers(data);
    }
  }, [organizationId, setLastAction]);

  /* --------------------------------------------------------------------------
   * 初期化
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    initialize();
    await fetchPlayers();
  }, [fetchPlayers, initialize]);

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

    await runApiAction(
      async () => {
        await requestJson("/api/private/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            rate: Number(initialRate),
            organizationId,
          }),
        });

        setName("");
        setInitialRate("1500");
        await fetchPlayers();
      },
      setLastAction,
      "register-success",
      "register-error"
    );
  }, [name, initialRate, organizationId, fetchPlayers, setLastAction]);

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("このプレイヤーを削除しますか？")) return;

      await runApiAction(
        async () => {
          await requestJson("/api/private/player", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, organizationId }),
          });
          await fetchPlayers();
        },
        setLastAction,
        "delete-success",
        "delete-error"
      );
    },
    [organizationId, fetchPlayers, setLastAction]
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
