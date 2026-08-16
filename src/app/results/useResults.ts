"use client";

import { useState, useCallback } from "react";
import { requestJson, runApiAction } from "@/lib/apiAction";
import { useManagementState } from "@/hooks/useManagementState";
import type { PlayerOption, PlayerRecord } from "@/types/player";
import type { ResultRecord, ResultSearchResponse } from "@/types/result";

export function useResults(organizationId: string) {
  const management = useManagementState<"search" | "register">("search");
  const { mounted, activeTab, setActiveTab, lastAction, setLastAction, initialize } = management;

  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);

  const [date, setDate] = useState<string | null>(null);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  const [playerOpt, setPlayerOpt] = useState<PlayerOption | null>(null);
  const [searchDate, setSearchDate] = useState("");

  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [registerDate, setRegisterDate] = useState("");
  const [roundIndex, setRoundIndex] = useState("1");

  const [searchParams, setSearchParams] = useState<{
    date?: string;
    playerId?: string;
  }>({});

  /* --------------------------------------------------------------------------
   * プレイヤー一覧取得
   * ------------------------------------------------------------------------ */
  const fetchPlayers = useCallback(async () => {
    const data = await runApiAction(
      () => requestJson<PlayerRecord[]>(`/api/private/player?organizationId=${organizationId}`),
      setLastAction,
      null,
      "fetch-error"
    );

    if (data) {
      setPlayers(data);
    }
  }, [organizationId, setLastAction]);

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* --------------------------------------------------------------------------
   * 対局結果取得
   * ------------------------------------------------------------------------ */
  const fetchResults = useCallback(
    async (params: Record<string, string | undefined>) => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      ) as Record<string, string>;

      const qs = new URLSearchParams({
        ...filtered,
        organizationId,
      }).toString();

      const data = await runApiAction(
        () => requestJson<ResultSearchResponse>(`/api/private/result?${qs}`),
        setLastAction,
        null,
        "fetch-error"
      );

      if (!data) {
        return undefined;
      }

      setResults(data.results ?? []);
      setDate(data.date ?? null);
      setPrevDate(data.prevDate ?? null);
      setNextDate(data.nextDate ?? null);
      if (data.date) {
        setSearchDate(data.date);
      }

      return data;
    },
    [organizationId, setLastAction]
  );

  /* --------------------------------------------------------------------------
   * 初期化
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    initialize();
    await fetchPlayers();
    const data = await fetchResults({});
    setSearchParams({ date: data?.date ?? undefined });
  }, [fetchPlayers, fetchResults, initialize]);

  /* --------------------------------------------------------------------------
   * 検索
   * ------------------------------------------------------------------------ */
  const handleSearch = useCallback(async () => {
    const params: Record<string, string> = {};
    if (searchDate) params.date = searchDate;
    if (playerOpt) params.playerId = playerOpt.value;

    setSearchParams(params);
    await fetchResults(params);

    setLastAction("search");
  }, [searchDate, playerOpt, fetchResults]);

  /* --------------------------------------------------------------------------
   * 検索クリア
   * ------------------------------------------------------------------------ */
  const clearSearch = useCallback(async () => {
    setPlayerOpt(null);
    setSearchDate("");
    setSearchParams({});
    await fetchResults({});

    setLastAction("search");
  }, [fetchResults]);

  /* --------------------------------------------------------------------------
   * 登録
   * ------------------------------------------------------------------------ */
  const handleRegister = useCallback(async (): Promise<boolean> => {
    if (!winnerOpt || !loserOpt || !registerDate || !roundIndex) {
      setLastAction("register-error");
      return false;
    }

    if (winnerOpt.value === loserOpt.value) {
      setLastAction("register-error");
      return false;
    }

    const w = players.find((p) => p.id === winnerOpt.value)!;
    const l = players.find((p) => p.id === loserOpt.value)!;

    const result = await runApiAction(
      async () => {
        await requestJson("/api/private/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winnerId: w.id,
            winnerName: w.name,
            winnerRate: w.currentRate,
            loserId: l.id,
            loserName: l.name,
            loserRate: l.currentRate,
            matchDate: Number(registerDate.replaceAll("-", "")),
            roundIndex: Number(roundIndex),
            organizationId,
          }),
        });

        await requestJson("/api/private/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId }),
        });

        await fetchPlayers();

        const params = { date: registerDate };
        setSearchParams(params);
        await fetchResults(params);
        return true;
      },
      setLastAction,
      "register-success",
      "register-error"
    );

    return Boolean(result);
  }, [
    winnerOpt,
    loserOpt,
    registerDate,
    roundIndex,
    players,
    organizationId,
    fetchResults,
    fetchPlayers,
    setLastAction,
  ]);

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      const target = results.find((r) => r.id === id);
      if (!target) return;

      if (!confirm("この対局結果を削除しますか？")) return;

      await runApiAction(
        async () => {
          await requestJson(`/api/private/result?id=${id}&organizationId=${organizationId}`, {
            method: "DELETE",
          });

          await requestJson("/api/private/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId }),
          });

          const s = target.matchDate.toString();
          const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

          const params = { ...searchParams, date: dateStr };
          setSearchParams(params);

          await fetchResults(params);
        },
        setLastAction,
        "delete-success",
        "delete-error"
      );
    },
    [results, organizationId, searchParams, fetchResults, setLastAction]
  );

  /* --------------------------------------------------------------------------
   * ラウンド選択肢
   * ------------------------------------------------------------------------ */
  const maxRound =
    results.length > 0 ? Math.max(...results.map((r) => r.roundIndex)) : 0;

  const selectableRounds = Array.from(
    { length: Math.min(maxRound + 1) },
    (_, i) => i + 1
  );

  /* --------------------------------------------------------------------------
   * 返却
   * ------------------------------------------------------------------------ */
  return {
    mounted,
    init,

    players,
    results,

    date,
    prevDate,
    nextDate,

    playerOpt,
    handlePlayerChange: setPlayerOpt,
    searchDate,
    setSearchDate,

    winnerOpt,
    setWinnerOpt,
    loserOpt,
    setLoserOpt,
    registerDate,
    setRegisterDate,
    roundIndex,
    setRoundIndex,

    activeTab,
    setActiveTab,

    playerOptions,
    selectableRounds,

    searchParams,
    fetchResults,
    handleSearch,
    clearSearch,
    handleRegister,
    handleDelete,

    lastAction, // ★ トースト通知用
  };
}
