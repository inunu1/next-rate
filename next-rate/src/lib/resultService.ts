/**
 * ============================================================================
 * 【ファイル名】
 * resultService.ts
 *
 * 【機能概要】
 * 対局結果（Result）に関するビジネスロジックを集約するサービス層。
 *
 * 【役割】
 * - Result API（/api/private/result）から呼び出される業務処理を担当
 * - Prisma アクセスを一元化し、API 層を薄く保つ
 * - バリデーション・重複チェック・整形処理を担当
 *
 * 【設計方針】
 * - route.ts は「認証 → body → service 呼び出し → jsonOk」に限定
 * - Prisma への直接アクセスは本ファイルに集約
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import type {
  PostResultBody,
  ResultRecord,
  ResultSearchResponse,
} from "@/types/result";

/* ============================================================================
 * GET: 対局結果検索
 * ============================================================================ */
export async function searchResults(
  targetUserId: string,
  dateStr: string | null,
  playerId: string | null
): Promise<ResultSearchResponse> {
  let targetMatchDate: number | null = null;

  // ------------------------------------------------------------
  // 日付指定あり
  // ------------------------------------------------------------
  if (dateStr) {
    targetMatchDate = Number(dateStr.replaceAll("-", ""));
  } else {
    // ------------------------------------------------------------
    // 最新日付を取得
    // ------------------------------------------------------------
    const latest = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(`
      SELECT DISTINCT "matchDate"
      FROM "Result"
      WHERE "userId" = '${targetUserId}'
      ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
      ORDER BY "matchDate" DESC LIMIT 1
    `);

    if (latest.length === 0) {
      return {
        date: null,
        prevDate: null,
        nextDate: null,
        results: [],
      };
    }

    targetMatchDate = latest[0].matchDate;
  }

  // ------------------------------------------------------------
  // 対象日の対局結果
  // ------------------------------------------------------------
  const results = await prisma.$queryRawUnsafe<ResultRecord[]>(`
    SELECT *
    FROM "Result"
    WHERE "matchDate" = ${targetMatchDate}
      AND "userId" = '${targetUserId}'
      ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
    ORDER BY "roundIndex" ASC
  `);

  // ------------------------------------------------------------
  // 前日
  // ------------------------------------------------------------
  const prev = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(`
    SELECT DISTINCT "matchDate"
    FROM "Result"
    WHERE "matchDate" < ${targetMatchDate}
      AND "userId" = '${targetUserId}'
      ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
    ORDER BY "matchDate" DESC LIMIT 1
  `);

  // ------------------------------------------------------------
  // 翌日
  // ------------------------------------------------------------
  const next = await prisma.$queryRawUnsafe<{ matchDate: number }[]>(`
    SELECT DISTINCT "matchDate"
    FROM "Result"
    WHERE "matchDate" > ${targetMatchDate}
      AND "userId" = '${targetUserId}'
      ${playerId ? `AND ("winnerId" = '${playerId}' OR "loserId" = '${playerId}')` : ""}
    ORDER BY "matchDate" ASC LIMIT 1
  `);

  const fmt = (n: number | undefined) => {
    if (!n) return null;
    const s = n.toString();
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  return {
    date: fmt(targetMatchDate)!,
    prevDate: fmt(prev[0]?.matchDate),
    nextDate: fmt(next[0]?.matchDate),
    results,
  };
}

/* ============================================================================
 * POST: 対局結果登録
 * ============================================================================ */
export async function createResult(
  body: PostResultBody,
  targetUserId: string
) {
  const {
    winnerId,
    winnerName,
    winnerRate,
    loserId,
    loserName,
    loserRate,
    matchDate,
    roundIndex,
  } = body;

  if (!winnerId || !loserId || !matchDate || !roundIndex) {
    return { error: "必須項目が不足しています", status: 400 };
  }

  // プレイヤー存在チェック
  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser = await prisma.player.findUnique({ where: { id: loserId } });

  if (!winner || !loser) {
    return { error: "プレイヤーが存在しません", status: 404 };
  }

  if (winner.userId !== targetUserId || loser.userId !== targetUserId) {
    return { error: "他団体のプレイヤーは登録できません", status: 403 };
  }

  // 同一ラウンドでの重複チェック
  const conflict = await prisma.result.findFirst({
    where: {
      matchDate,
      roundIndex,
      userId: targetUserId,
      OR: [{ winnerId }, { loserId }],
    },
  });

  if (conflict) {
    return {
      error: "同一ラウンドで既に対局済みのプレイヤーが含まれています",
      status: 409,
    };
  }

  const created = await prisma.result.create({
    data: {
      winnerId,
      winnerName,
      winnerRate,
      loserId,
      loserName,
      loserRate,
      matchDate,
      roundIndex,
      userId: targetUserId,
    },
  });

  return { data: created };
}

/* ============================================================================
 * DELETE: 対局結果削除
 * ============================================================================ */
export async function deleteResult(id: string, targetUserId: string) {
  if (!id) {
    return { error: "id が必要です", status: 400 };
  }

  const result = await prisma.result.findUnique({ where: { id } });

  if (!result) {
    return { error: "対局結果が存在しません", status: 404 };
  }

  if (result.userId !== targetUserId) {
    return { error: "他団体の対局結果は削除できません", status: 403 };
  }

  await prisma.result.delete({ where: { id } });

  return { data: { success: true } };
}
