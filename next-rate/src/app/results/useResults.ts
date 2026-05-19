"use client";

import { useState, useCallback, useEffect } from "react";
import type { Player, Result } from "@prisma/client";
import { parseApiResponse } from "@/lib/fetchJson";

export type PlayerOption = { value: string; label: string };

export function useResults(organizationId: string) {
  const [mounted, setMounted] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const [date, setDate] = useState<string | null>(null);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  const [playerOpt, setPlayerOpt] = useState<PlayerOption | null>(null);
  const [searchDate, setSearchDate] = useState("");

  const [winnerOpt, setWinnerOpt] = useState<PlayerOption | null>(null);
  const [loserOpt, setLoserOpt] = useState<PlayerOption | null>(null);
  const [registerDate, setRegisterDate] = useState("");
  const [roundIndex, setRoundIndex] = useState("1");

  const [activeTab, setActiveTab] = useState<"search" | "register">("search");

  const [searchParams, setSearchParams] = useState<{
    date?: string;
    playerId?: string;
  }>({});

  const [lastAction, setLastAction] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
   * プレイヤー一覧取得
   * ------------------------------------------------------------------------ */
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/private/player?organizationId=${organizationId}`
      );
      const data = await parseApiResponse<Player[]>(res);
      setPlayers(data);
    } catch {
      setLastAction("fetch-error");
    }
  }, [organizationId]);

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* --------------------------------------------------------------------------
   * 対局結果取得
   * ------------------------------------------------------------------------ */
  const fetchResults = useCallback(
    async (params: Record<string, string | undefined>) => {
      try {
        const filtered = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined)
        ) as Record<string, string>;

        const qs = new URLSearchParams({
          ...filtered,
          organizationId,
        }).toString();

        const res = await fetch(`/api/private/result?${qs}`);
        const data = await parseApiResponse<{
          date: string | null;
          prevDate: string | null;
          nextDate: string | null;
          results: Result[];
        }>(res);

        setResults(data.results ?? []);
        setDate(data.date ?? null);
        setPrevDate(data.prevDate ?? null);
        setNextDate(data.nextDate ?? null);

        return data;
      } catch {
        setLastAction("fetch-error");
      }
    },
    [organizationId]
  );

  /* --------------------------------------------------------------------------
   * 初期化（owner の団体切替にも対応）
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    const data = await fetchResults({});
    await fetchPlayers();

    setSearchParams({ date: data?.date ?? undefined });
    setMounted(true);
  }, [fetchPlayers, fetchResults]);

  /* --------------------------------------------------------------------------
   * organizationId が変わったら再初期化（owner の団体切替対応）
   * ------------------------------------------------------------------------ */
  useEffect(() => {
    init();
  }, [init, organizationId]);

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
  const handleRegister = useCallback(async () => {
    if (!winnerOpt || !loserOpt || !registerDate || !roundIndex) {
      setLastAction("register-error");
      return;
    }

    if (winnerOpt.value === loserOpt.value) {
      setLastAction("register-error");
      return;
    }

    try {
      const w = players.find((p) => p.id === winnerOpt.value)!;
      const l = players.find((p) => p.id === loserOpt.value)!;

      const res = await fetch("/api/private/result", {
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
      await parseApiResponse(res);

      await fetch("/api/private/calculate", {
        method: "POST",
        body: JSON.stringify({ organizationId }),
      });

      setLastAction("register-success");

      const params = { date: registerDate };
      setSearchParams(params);
      await fetchResults(params);
    } catch {
      setLastAction("register-error");
    }
  }, [
    winnerOpt,
    loserOpt,
    registerDate,
    roundIndex,
    players,
    organizationId,
    fetchResults,
  ]);

  /* --------------------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------------------ */
  const handleDelete = useCallback(
    async (id: string) => {
      const target = results.find((r) => r.id === id);
      if (!target) return;

      if (!confirm("この対局結果を削除しますか？")) return;

      try {
        const res = await fetch(
          `/api/private/result?id=${id}&organizationId=${organizationId}`,
          { method: "DELETE" }
        );
        await parseApiResponse(res);

        await fetch("/api/private/calculate", {
          method: "POST",
          body: JSON.stringify({ organizationId }),
        });

        setLastAction("delete-success");

        const s = target.matchDate.toString();
        const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

        const params = { ...searchParams, date: dateStr };
        setSearchParams(params);

        await fetchResults(params);
      } catch {
        setLastAction("delete-error");
      }
    },
    [results, organizationId, searchParams, fetchResults]
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
   * 初期ロード後に日付欄へ反映
   * ------------------------------------------------------------------------ */
  useEffect(() => {
    if (mounted && date) {
      setSearchDate(date);
    }
  }, [mounted, date]);

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

    lastAction,
  };
}
