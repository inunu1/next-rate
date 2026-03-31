"use client";

/**
 * ============================================================
 * 対局結果管理ロジック（useResults）
 * ------------------------------------------------------------
 * 【責務】
 * ・対局結果の取得／検索
 * ・対局結果の登録／削除
 * ・プレイヤー一覧の取得
 * ・日付一覧の取得（/api/result/dates）
 * ・前後日付の計算（クライアント側）
 * ・画面状態の管理
 * ============================================================
 */

import { useState } from "react";
import type { Player, Result } from "@prisma/client";

export type PlayerOption = {
  value: string;
  label: string;
};

export function useResults() {
  /* ------------------------------------------------------------
   * 1. 画面状態管理
   * ------------------------------------------------------------ */
  const [mounted, setMounted] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  /** 全対局日付一覧（YYYYMMDD 数値） */
  const [dates, setDates] = useState<number[]>([]);

  /** 現在表示中の日付（YYYY-MM-DD） */
  const [date, setDate] = useState<string | null>(null);

  /** 前後の日付（YYYY-MM-DD） */
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
   * 2. 初期化処理（順番が超重要）
   * ------------------------------------------------------------ */
  const init = async () => {
    // ① 日付一覧
    await fetchDates();

    // ② プレイヤー一覧
    await fetchPlayers();

    // ③ 最新日付の対局結果
    await fetchResults();

    // ④ 全て揃ってから描画
    setMounted(true);
  };

  /* ------------------------------------------------------------
   * 3. 日付一覧取得
   * ------------------------------------------------------------ */
  const fetchDates = async () => {
    const res = await fetch("/api/result/dates");
    const data = await res.json();
    setDates(data.dates);
  };

  /* ------------------------------------------------------------
   * 4. プレイヤー取得
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
   * 5. 対局結果取得（検索含む）
   * ------------------------------------------------------------ */
  const fetchResults = async (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`/api/private/result${query}`);
    const data = await res.json();

    setResults(Array.isArray(data.results) ? data.results : []);
    setDate(data.date ?? null);

    // dates が揃っている時だけ prev/next を計算
    if (dates.length > 0 && data.date) {
      updatePrevNext(data.date);
    }
  };

  /* ------------------------------------------------------------
   * 6. 前後日付の計算（クライアント側）
   * ------------------------------------------------------------ */
  const updatePrevNext = (yyyy_mm_dd: string) => {
    const yyyymmdd = Number(yyyy_mm_dd.replaceAll("-", ""));
    const idx = dates.indexOf(yyyymmdd);

    const prev = idx > 0 ? dates[idx - 1] : null;
    const next = idx < dates.length - 1 ? dates[idx + 1] : null;

    setPrevDate(prev ? formatDate(prev) : null);
    setNextDate(next ? formatDate(next) : null);
  };

  /** yyyymmdd → yyyy-mm-dd */
  const formatDate = (n: number) => {
    const s = n.toString();
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  /* ------------------------------------------------------------
   * 7. 検索処理
   * ------------------------------------------------------------ */
  const handleSearch = () => {
    const params: Record<string, string> = {};

    if (searchDate) params.date = searchDate;

    fetchResults(params);
  };

  /* ------------------------------------------------------------
   * 8. 対局結果登録処理
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

    // 日付一覧を更新
    await fetchDates();

    // 登録した日付の結果を再取得
    await fetchResults({ date: registerDate });
  };

  /* ------------------------------------------------------------
   * 9. 対局結果削除処理
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

    await fetchDates();

    const s = target.matchDate.toString();
    const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

    await fetchResults({ date: dateStr });
  };

  /* ------------------------------------------------------------
   * 10. ラウンド選択肢
   * ------------------------------------------------------------ */
  const maxRound =
    results.length > 0 ? Math.max(...results.map((r) => r.roundIndex)) : 0;

  const selectableRounds = Array.from(
    { length: Math.min(maxRound + 1) },
    (_, i) => i + 1
  );

  /* ------------------------------------------------------------
   * 11. 外部公開（UI に渡す public API）
   * ------------------------------------------------------------ */
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