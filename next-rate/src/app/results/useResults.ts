"use client";

/**
 * ============================================================
 * 対局結果管理ロジック（useResults）
 * ------------------------------------------------------------
 * 【責務】
 * ・対局結果の取得／検索
 * ・対局結果の登録（業務バリデーション含む）
 * ・対局結果の削除（削除後の遷移含む）
 * ・プレイヤー一覧の取得
 * ・画面状態の管理
 *
 * 【非責務】
 * ・UI 表示（ResultsClient.tsx に委譲）
 * ・DB アクセス（API Route に委譲）
 * ・認証（page.tsx 側で実施）
 * ============================================================
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Player, Result } from "@prisma/client";

export type PlayerOption = {
  value: string;
  label: string;
};

export function useResults() {
  const router = useRouter();

  /* ------------------------------------------------------------
   * 1. 画面状態管理
   * ------------------------------------------------------------ */
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

  /* ------------------------------------------------------------
   * 2. 初期化処理
   * ------------------------------------------------------------ */
  const init = async () => {
    setMounted(true);
    await fetchPlayers();
    await fetchResults();
  };

  /* ------------------------------------------------------------
   * 3. プレイヤー取得
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
   * 4. 対局結果取得（検索含む）
   * ------------------------------------------------------------ */
  const fetchResults = async (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`/api/private/result${query}`);
    const data = await res.json();

    setResults(Array.isArray(data.results) ? data.results : []);
    setDate(data.date ?? null);
    setPrevDate(data.prevDate ?? null);
    setNextDate(data.nextDate ?? null);
  };

  /* ------------------------------------------------------------
   * 5. 検索処理（クライアント → API）
   * ------------------------------------------------------------ */
  const handleSearch = () => {
    const params: Record<string, string> = {};

    if (playerOpt) params.playerId = playerOpt.value;
    if (searchDate) params.date = searchDate;

    fetchResults(params);
  };

  /* ------------------------------------------------------------
   * 6. 対局結果登録処理
   * ------------------------------------------------------------
   * 【業務ルール】
   * ① 必須項目チェック
   * ② 勝者・敗者の同一チェック
   * ③ 同一日付 × 同一ラウンドでの重複対局チェック
   * ④ 登録後はレート再計算
   * ⑤ 登録した日付ページへ遷移
   * ------------------------------------------------------------ */
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ① 必須チェック
    if (!winnerOpt || !loserOpt || !registerDate || !roundIndex) {
      alert("勝者・敗者・対局日・ラウンドは必須です");
      return;
    }

    // ② 勝者・敗者の同一チェック
    if (winnerOpt.value === loserOpt.value) {
      alert("勝者と敗者は別のプレイヤーを選んでください");
      return;
    }

    // 入力値の正規化
    const w = players.find((p) => p.id === winnerOpt.value)!;
    const l = players.find((p) => p.id === loserOpt.value)!;

    const matchDate = Number(registerDate.replaceAll("-", ""));
    const round = Number(roundIndex);

    // ③ 同一ラウンド重複対局チェック
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

    // ④ 対局結果登録
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

    // レート再計算
    await fetch("/api/private/calculate", { method: "POST" });

    alert("登録が完了しました");

    // ⑤ 登録した日付ページへ遷移
    const s = matchDate.toString();
    const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

    router.push(`/results?date=${dateStr}`);
  };

  /* ------------------------------------------------------------
   * 7. 対局結果削除処理
   * ------------------------------------------------------------
   * 【業務ルール】
   * ① 削除対象の対局を事前に取得
   * ② 削除確認
   * ③ 削除処理
   * ④ レート再計算
   * ⑤ 削除した対局の日付ページへ遷移
   * ------------------------------------------------------------ */
  const handleDelete = async (id: string) => {
    // ① 削除対象取得
    const target = results.find((r) => r.id === id);
    if (!target) {
      alert("削除対象の対局が見つかりません");
      return;
    }

    // ② 削除確認
    if (!confirm("この対局結果を削除しますか？")) return;

    // ③ 削除処理
    await fetch(`/api/private/result?id=${id}`, { method: "DELETE" });

    // ④ レート再計算
    await fetch("/api/private/calculate", { method: "POST" });

    alert("削除が完了しました");

    // ⑤ 削除した日付ページへ遷移
    const s = target.matchDate.toString();
    const dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

    router.push(`/results?date=${dateStr}`);
  };

  /* ------------------------------------------------------------
   * 8. ラウンド選択肢（最大ラウンド + 1）
   * ------------------------------------------------------------ */
  const maxRound =
    results.length > 0 ? Math.max(...results.map((r) => r.roundIndex)) : 0;

  const selectableRounds = Array.from(
    { length: Math.min(maxRound + 1) },
    (_, i) => i + 1
  );

  /* ------------------------------------------------------------
   * 9. 外部公開（UI から利用する値・関数）
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