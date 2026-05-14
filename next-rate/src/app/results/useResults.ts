"use client";

/**
 * ============================================================================
 * useResults（対局結果管理ロジック）完全修正版
 * ・トースト通知用 lastAction を追加
 * ・alert() を全廃し、UI 側で toast を出せる構造に統一
 * ・UserClient と同じ設計思想で責務分離
 * ============================================================================
 */

import { useState, useCallback, useEffect } from "react";
import type { Player, Result } from "@prisma/client";
import { parseApiResponse } from "@/lib/fetchJson";

export type PlayerOption = { value: string; label: string };

export function useResults(userId: string) {
  /* --------------------------------------------------------------------------
   * 状態管理
   * ------------------------------------------------------------------------ */
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

  // ★ トースト通知用
  const [lastAction, setLastAction] = useState<string | null>(null);

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
          userId,
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
    [userId]
  );

  /* --------------------------------------------------------------------------
   * 初期化
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    setMounted(true);
    await fetchPlayers();
    const data = await fetchResults({});
    setSearchParams({ date: data?.date ?? undefined });
  }, [fetchPlayers, fetchResults]);

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
          userId,
        }),
      });
      await parseApiResponse(res);

      await fetch("/api/private/calculate", {
        method: "POST",
        body: JSON.stringify({ userId }),
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
    userId,
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
        const res = await fetch(`/api/private/result?id=${id}&userId=${userId}`, {
          method: "DELETE",
        });
        await parseApiResponse(res);

        await fetch("/api/private/calculate", {
          method: "POST",
          body: JSON.stringify({ userId }),
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
    [results, userId, searchParams, fetchResults]
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
