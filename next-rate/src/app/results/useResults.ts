"use client";

/**
 * ============================================================================
 * 【フック名称】
 * useResults（対局結果管理ロジック）
 *
 * 【機能概要】
 * ・団体（userId）に紐づく対局結果の取得・検索・登録・削除を行う。
 *
 * 【設計方針】
 * ① API は userId パラメータ方式を採用するため、
 *    本フックは常に currentUserId（操作対象団体）を受け取る。
 *
 * ② admin（団体オーナー）
 *      - currentUserId はセッションの user.id
 *      - API 側で強制的に自団体に制限される
 *
 * ③ owner（SaaS 運営者）
 *      - 画面側で団体選択 UI により currentUserId を切り替える
 *      - API に userId を渡すことで任意団体を操作可能
 *
 * ④ Select コンポーネントは Option 型を使用するため、
 *    playerOpt / winnerOpt / loserOpt は Option | null を保持する。
 *
 * 【提供機能】
 * ・対局結果一覧取得
 * ・対局結果検索（日付・プレイヤー）
 * ・対局結果新規登録
 * ・対局結果削除
 *
 * 【例外処理方針】
 * ・API エラーは呼び出し元でハンドリング
 * ・本フックでは最低限の alert のみ実施
 * ============================================================================
 */

import { useEffect, useState } from "react";
import type { Player, Result } from "@prisma/client";

export type PlayerOption = { value: string; label: string };

export function useResults(currentUserId: string) {
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
   * プレイヤー一覧取得（userId パラメータ方式）
   * ======================================================================== */
  const fetchPlayers = async () => {
    const res = await fetch(`/api/private/player?userId=${currentUserId}`);
    const data = await res.json();
    setPlayers(data);
  };

  const playerOptions: PlayerOption[] = players.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  /* ==========================================================================
   * プレイヤー選択変更
   * ======================================================================== */
  const handlePlayerChange = (opt: PlayerOption | null) => {
    setPlayerOpt(opt);
  };

  /* ==========================================================================
   * 対局結果取得（userId パラメータ方式）
   * ======================================================================== */
  const fetchResults = async (
    params: Record<string, string | undefined>
  ) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter((entry) => entry[1] !== undefined)
    ) as Record<string, string>;

    const queryString = new URLSearchParams({
      ...filteredParams,
      userId: currentUserId, // ★ userId を必ず付与
    }).toString();

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
   * 検索クリア
   * ======================================================================== */
  const clearSearch = async () => {
    setPlayerOpt(null);
    setSearchDate("");

    setSearchParams({});
    await fetchResults({});
  };

  /* ==========================================================================
   * 初期ロード後に日付欄へ反映
   * ======================================================================== */
  useEffect(() => {
    if (mounted && date) {
      setSearchDate(date);
    }
  }, [mounted, date]);

  /* ==========================================================================
   * 登録（userId パラメータ方式）
   * ======================================================================== */
  const handleRegister = async () => {
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
        userId: currentUserId, // ★ userId を付与
      }),
    });

    await fetch("/api/private/calculate", {
      method: "POST",
      body: JSON.stringify({ userId: currentUserId }), // ★ 計算も団体単位
    });

    alert("登録が完了しました");

    const params = { date: registerDate };
    setSearchParams(params);

    await fetchResults(params);
  };

  /* ==========================================================================
   * 削除（userId パラメータ方式）
   * ======================================================================== */
  const handleDelete = async (id: string) => {
    const target = results.find((r) => r.id === id);
    if (!target) return;

    if (!confirm("この対局結果を削除しますか？")) return;

    await fetch(`/api/private/result?id=${id}&userId=${currentUserId}`, {
      method: "DELETE",
    });

    await fetch("/api/private/calculate", {
      method: "POST",
      body: JSON.stringify({ userId: currentUserId }),
    });

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
