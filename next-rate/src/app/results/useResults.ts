"use client";

import { useState } from "react";
import type { Player, Result } from "@prisma/client";

export type PlayerOption = { value: string; label: string };

export function useResults() {
  const [mounted, setMounted] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const [dates, setDates] = useState<number[]>([]);
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

  /* ------------------------------------------------------------
   * 初期化（dates → latest → results）
   * ------------------------------------------------------------ */
  const init = async () => {
    const d = await fetchDates();              // ① 日付一覧（ローカル変数 d）
    await fetchPlayers();                      // ② プレイヤー一覧
    const latest = formatDate(d.at(-1)!);      // ③ 最新日付
    await fetchResults({ date: latest }, d);   // ④ 初期表示だけ d を渡す
    setMounted(true);                          // ⑤ 描画開始
  };

  /* ------------------------------------------------------------
   * 日付一覧取得（dates を state にセット）
   * ------------------------------------------------------------ */
  const fetchDates = async () => {
    const res = await fetch("/api/private/dates");
    const data = await res.json();
    setDates(data.dates);
    return data.dates; // ← 初期表示用に返す
  };

  /* ------------------------------------------------------------
   * プレイヤー一覧
   * ------------------------------------------------------------ */
  const fetchPlayers = async () => {
    const res = await fetch("/api/private/player");
    const data = await res.json();
    setPlayers(data);
  };

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* ------------------------------------------------------------
   * 対局結果取得（初期表示は d、以降は dates を使う）
   * ------------------------------------------------------------ */
  const fetchResults = async (
    params?: Record<string, string>,
    dateList?: number[] // ← 初期表示だけ渡す
  ) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`/api/private/result${query}`);
    const data = await res.json();

    setResults(Array.isArray(data.results) ? data.results : []);
    setDate(data.date ?? null);

    if (data.date) {
      updatePrevNext(data.date, dateList ?? dates);
    }
  };

  /* ------------------------------------------------------------
   * 前後日付の計算（dateList を必ず使う）
   * ------------------------------------------------------------ */
  const updatePrevNext = (yyyy_mm_dd: string, dateList: number[]) => {
    const yyyymmdd = Number(yyyy_mm_dd.replaceAll("-", ""));
    const idx = dateList.indexOf(yyyymmdd);

    const prev = idx > 0 ? dateList[idx - 1] : null;
    const next = idx < dateList.length - 1 ? dateList[idx + 1] : null;

    setPrevDate(prev ? formatDate(prev) : null);
    setNextDate(next ? formatDate(next) : null);
  };

  const formatDate = (n: number) => {
    const s = n.toString();
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  /* ------------------------------------------------------------
   * プレイヤー絞り込み（UI 側で完結）
   * ------------------------------------------------------------ */
  const filteredResults = playerOpt
    ? results.filter(
        (r) =>
          r.winnerId === playerOpt.value ||
          r.loserId === playerOpt.value
      )
    : results;

  /* ------------------------------------------------------------
   * 検索（dates（state）を使う）
   * ------------------------------------------------------------ */
  const handleSearch = async () => {
    const params: Record<string, string> = {};
    if (searchDate) params.date = searchDate;
    await fetchResults(params); // ← dates（state）を使う
  };

  /* ------------------------------------------------------------
   * 登録
   * ------------------------------------------------------------ */
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

    const conflict = results.some((r) => {
      return (
        r.matchDate === matchDate &&
        r.roundIndex === round &&
        (r.winnerId === w.id ||
          r.loserId === w.id ||
          r.winnerId === l.id ||
          r.loserId === l.id)
      );
    });

    if (conflict) {
      alert("このラウンドで既に対局済みのプレイヤーが含まれています");
      return;
    }

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

    const d = await fetchDates(); // ← dates を更新
    await fetchResults({ date: registerDate }, d);
  };

  /* ------------------------------------------------------------
   * 削除
   * ------------------------------------------------------------ */
  const handleDelete = async (id: string) => {
    const target = results.find((r) => r.id === id);
    if (!target) {
      alert("削除対象の対局が見つかりません");
      return;
    }

    if (!confirm("この対局結果を削除しますか？")) return;

    await fetch(`/api/private/result?id=${id}`, { method: "DELETE" });
    await fetch("/api/private/calculate", { method: "POST" });

    alert("削除が完了しました");

    const d = await fetchDates(); // ← dates を更新

    const s = target.matchDate.toString();
    const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

    await fetchResults({ date: dateStr }, d);
  };

  /* ------------------------------------------------------------
   * ラウンド選択肢
   * ------------------------------------------------------------ */
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
    filteredResults, // ← UI 側で絞り込み済み

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