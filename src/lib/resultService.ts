/**
 * ============================================================================
 * resultService.ts（Prisma.sql 版・完全安全）
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import type { PostResultBody, ResultSearchResponse } from "@/types/result";

/* ============================================================================
 * GET: 対局結果検索（安全版）
 * ============================================================================ */
export async function searchResults(
  targetUserId: string,
  dateStr: string | null,
  playerId: string | null
): Promise<ResultSearchResponse> {
  const baseFilter = {
    organizationId: targetUserId,
    ...(playerId ? { OR: [{ winnerId: playerId }, { loserId: playerId }] } : {}),
  };

  let targetMatchDate: number;

  if (dateStr) {
    targetMatchDate = Number(dateStr.replaceAll("-", ""));
  } else {
    const latest = await prisma.result.findMany({
      where: baseFilter,
      distinct: ["matchDate"],
      orderBy: { matchDate: "desc" },
      select: { matchDate: true },
      take: 1,
    });

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

  const results = await prisma.result.findMany({
    where: {
      ...baseFilter,
      matchDate: targetMatchDate,
    },
    orderBy: { roundIndex: "asc" },
  });

  const prev = await prisma.result.findMany({
    where: {
      ...baseFilter,
      matchDate: { lt: targetMatchDate },
    },
    distinct: ["matchDate"],
    orderBy: { matchDate: "desc" },
    select: { matchDate: true },
    take: 1,
  });

  const next = await prisma.result.findMany({
    where: {
      ...baseFilter,
      matchDate: { gt: targetMatchDate },
    },
    distinct: ["matchDate"],
    orderBy: { matchDate: "asc" },
    select: { matchDate: true },
    take: 1,
  });

  const fmt = (n: number | undefined) => {
    if (!n) return null;
    const s = n.toString();
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  return {
    date: fmt(targetMatchDate),
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

  const winner = await prisma.player.findUnique({ where: { id: winnerId } });
  const loser = await prisma.player.findUnique({ where: { id: loserId } });

  if (!winner || !loser) {
    return { error: "プレイヤーが存在しません", status: 404 };
  }

  if (winner.organizationId !== targetUserId || loser.organizationId !== targetUserId) {
    return { error: "他団体のプレイヤーは登録できません", status: 403 };
  }

  const conflict = await prisma.result.findFirst({
    where: {
      matchDate,
      roundIndex,
      organizationId: targetUserId,
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
      organizationId: targetUserId,
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

  if (result.organizationId !== targetUserId) {
    return { error: "他団体の対局結果は削除できません", status: 403 };
  }

  await prisma.result.delete({ where: { id } });

  return { data: { success: true } };
}
