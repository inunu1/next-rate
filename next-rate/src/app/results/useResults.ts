"use client";

import { useEffect, useState } from "react";
import type { Player, Result } from "@prisma/client";

export type PlayerOption = { value: string; label: string };

export function useResults() {
  /* ==========================================================================
   * 状態管理
   * ======================================================================== */
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

  /* ==========================================================================
   * 初期化
   * ======================================================================== */
  const init = async () => {
    await fetchPlayers();

    const data = await fetchResults({});
    setSearchParams({ date: data.date ?? undefined });

    setMounted(true);
  };

  /* ==========================================================================
   * プレイヤー一覧取得
   * ======================================================================== */
  const fetchPlayers = async () => {
    const res = await fetch("/api/private/player");
    const data = await res.json();
    setPlayers(data);
  };

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* ==========================================================================
   * プレイヤー変更時：検索条件から playerId を削除
   * ======================================================================== */
  const handlePlayerChange = (opt: PlayerOption | null) => {
    setPlayerOpt(opt);

    setSearchParams((prev) => {
      const { playerId, ...rest } = prev;
      return rest;
    });
  };

  /* ==========================================================================
   * 対局結果取得（API が prev/next を返す）
   * ======================================================================== */
  const fetchResults = async (
    params: Record<string, string | undefined>
  ) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter((entry) => entry[1] !== undefined)
    ) as Record<string, string>;

    const queryString = new URLSearchParams(filteredParams).toString();

    const res = await fetch(`/api/private/result?${queryString}`);
    const data = await res.json();

    setResults(data.results ?? []);
    setDate(data.date ?? null);
    setPrevDate(data.prevDate ?? null);
    setNextDate(data.nextDate ?? null);

    return data;
  };

  /* ==========================================================================
   * 検索
   * ======================================================================== */
  const handleSearch = async () => {
    const params: Record<string, string> = {};

    if (searchDate) params.date = searchDate;
    if (playerOpt) params.playerId = playerOpt.value;

    setSearchParams(params);
    await fetchResults(params);
  };

  /* ==========================================================================
   * 検索条件クリア
   * ======================================================================== */
  const clearSearch = async () => {
    setPlayerOpt(null);
    setSearchDate("");

    setSearchParams({});
    await fetchResults({});
  };

  /* ==========================================================================
   * 初期化時：API が返した date を検索欄に反映
   * ======================================================================== */
  useEffect(() => {
    if (!mounted && date) {
      setSearchDate(date);
    }
  }, [mounted, date]);

  /* ==========================================================================
   * 登録
   * ======================================================================== */
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!winnerOpt || !loserOpt || !registerDate || !roundIndex) {
      alert("勝者・敗者・対局日・ラウンドは必須です");
      return;
    }

    if (winnerOpt.value === loserOpt.value) {
      alert("勝者と敗者は別のプレイヤーを選んでください");
      return;
    }

    const w = players.find((p) => p.id === winnerOpt.value)!;
    const l = players.find((p) => p.id === loserOpt.value)!;

    const matchDate = Number(registerDate.replaceAll("-", ""));
    const round = Number(roundIndex);

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
        matchDate,
        roundIndex: round,
      }),
    });

    await fetch("/api/private/calculate", { method: "POST" });

    alert("登録が完了しました");

    const params = { date: registerDate };
    setSearchParams(params);

    await fetchResults(params);
  };

  /* ==========================================================================
   * 削除
   * ======================================================================== */
  const handleDelete = async (id: string) => {
    const target = results.find((r) => r.id === id);
    if (!target) return;

    if (!confirm("この対局結果を削除しますか？")) return;

    await fetch(`/api/private/result?id=${id}`, { method: "DELETE" });
    await fetch("/api/private/calculate", { method: "POST" });

    alert("削除が完了しました");

    const s = target.matchDate.toString();
    const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

    const params = { ...searchParams, date: dateStr };
    setSearchParams(params);

    await fetchResults(params);
  };

  /* ==========================================================================
   * ラウンド選択肢
   * ======================================================================== */
  const maxRound =
    results.length > 0 ? Math.max(...results.map((r) => r.roundIndex)) : 0;

  const selectableRounds = Array.from(
    { length: Math.min(maxRound + 1) },
    (_, i) => i + 1
  );

  /* ==========================================================================
   * 返却
   * ======================================================================== */
  return {
    mounted,
    init,

    players,
    results,

    date,
    prevDate,
    nextDate,

    playerOpt,
    handlePlayerChange,
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