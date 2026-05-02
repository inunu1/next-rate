"use client";

/**
 * ============================================================================
 * 【フック名称】
 * useResults（対局結果管理ロジック）
 *
 * 【機能概要】
 * ・団体（userId）に紐づく対局結果の検索・登録・削除を行う。
 *
 * 【設計方針】
 * ① API は userId パラメータ方式
 * ② admin → 自団体固定
 * ③ owner → 団体選択 UI で userId を切り替え
 * ④ init は useCallback 化し、useEffect の依存警告を解消
 * ============================================================================
 */

import { useState, useCallback, useEffect } from "react";
import type { Player, Result } from "@prisma/client";

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

  /* --------------------------------------------------------------------------
   * プレイヤー一覧取得
   * ------------------------------------------------------------------------ */
  const fetchPlayers = useCallback(async () => {
    const res = await fetch(`/api/private/player?userId=${userId}`);
    const data = await res.json();
    setPlayers(data);
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
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      ) as Record<string, string>;

      const qs = new URLSearchParams({
        ...filtered,
        userId,
      }).toString();

      const res = await fetch(`/api/private/result?${qs}`);
      const data = await res.json();

      setResults(data.results ?? []);
      setDate(data.date ?? null);
      setPrevDate(data.prevDate ?? null);
      setNextDate(data.nextDate ?? null);

      return data;
    },
    [userId]
  );

  /* --------------------------------------------------------------------------
   * 初期化（useCallback 化）
   * ------------------------------------------------------------------------ */
  const init = useCallback(async () => {
    setMounted(true);
    await fetchPlayers();
    const data = await fetchResults({});
    setSearchParams({ date: data.date ?? undefined });
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
  }, [searchDate, playerOpt, fetchResults]);

  /* --------------------------------------------------------------------------
   * 検索クリア
   * ------------------------------------------------------------------------ */
  const clearSearch = useCallback(async () => {
    setPlayerOpt(null);
    setSearchDate("");
    setSearchParams({});
    await fetchResults({});
  }, [fetchResults]);

  /* --------------------------------------------------------------------------
   * 登録
   * ------------------------------------------------------------------------ */
  const handleRegister = useCallback(async () => {
    if (!winnerOpt || !loserOpt || !registerDate || !roundIndex) {
      alert("必須項目が不足しています");
      return;
    }

    if (winnerOpt.value === loserOpt.value) {
      alert("勝者と敗者は異なる必要があります");
      return;
    }

    const w = players.find((p) => p.id === winnerOpt.value)!;
    const l = players.find((p) => p.id === loserOpt.value)!;

    await fetch("/api/private/result", {
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

    await fetch("/api/private/calculate", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });

    alert("登録が完了しました");

    const params = { date: registerDate };
    setSearchParams(params);
    await fetchResults(params);
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

      await fetch(`/api/private/result?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });

      await fetch("/api/private/calculate", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });

      alert("削除が完了しました");

      const s = target.matchDate.toString();
      const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

      const params = { ...searchParams, date: dateStr };
      setSearchParams(params);

      await fetchResults(params);
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
  };
}
