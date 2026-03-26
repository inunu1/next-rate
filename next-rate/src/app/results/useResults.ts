"use client";

import { useState } from "react";
import { Player, Result } from "@prisma/client";

export type PlayerOption = {
  value: string;
  label: string;
};

export function useResults() {
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

  /* -----------------------------
   * 初期ロード
   * --------------------------- */
  const init = async () => {
    setMounted(true);
    await fetchPlayers();
    await fetchResults();
  };

  /* -----------------------------
   * プレイヤー取得
   * --------------------------- */
  const fetchPlayers = async () => {
    const res = await fetch("/api/private/player");
    const data = await res.json();
    setPlayers(data);
  };

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* -----------------------------
   * 対局結果取得
   * --------------------------- */
  const fetchResults = async (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`/api/private/result${query}`);
    const data = await res.json();

    setResults(Array.isArray(data.results) ? data.results : []);
    setDate(data.date ?? null);
    setPrevDate(data.prevDate ?? null);
    setNextDate(data.nextDate ?? null);
  };

  /* -----------------------------
   * 検索
   * --------------------------- */
  const handleSearch = () => {
    const params: Record<string, string> = {};

    if (playerOpt) params.playerId = playerOpt.value;
    if (searchDate) params.date = searchDate;

    fetchResults(params);
  };

  /* -----------------------------
   * 登録
   * --------------------------- */
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

    fetchResults();
  };

  /* -----------------------------
   * 削除
   * --------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("この対局結果を削除しますか？")) return;

    await fetch(`/api/private/result?id=${id}`, { method: "DELETE" });
    await fetch("/api/private/calculate", { method: "POST" });

    alert("削除が完了しました");

    if (date) {
      fetchResults({
        date,
        ...(playerOpt ? { playerId: playerOpt.value } : {}),
      });
    } else {
      fetchResults();
    }
  };

  /* -----------------------------
   * ラウンド選択肢
   * --------------------------- */
  const maxRound =
    results.length > 0 ? Math.max(...results.map((r) => r.roundIndex)) : 0;

  const selectableRounds = Array.from(
    { length: Math.min(maxRound + 1) },
    (_, i) => i + 1
  );

  return {
    mounted,
    init,

    players,
    results,

    date,
    prevDate,
    nextDate,

    playerOpt,
    setPlayerOpt,
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

    fetchResults,
    handleSearch,
    handleRegister,
    handleDelete,
  };
}