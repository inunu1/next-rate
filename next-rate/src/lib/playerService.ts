/**
 * ============================================================================
 * 【ファイル名】
 * playerService.ts
 *
 * 【機能概要】
 * プレイヤー（Player）に関するビジネスロジックを集約するサービス層。
 *
 * 【役割】
 * - Player API（/api/private/player）から呼び出される業務処理を担当
 * - Prisma アクセスを一元化し、API 層を薄く保つ
 * - バリデーション・重複チェック・整形処理を担当
 *
 * 【設計方針】
 * - route.ts は「認証 → body 取得 → service 呼び出し → jsonOk」に限定
 * - Prisma への直接アクセスは本ファイルに集約
 * - SIer 風に業務仕様コメントを明確化
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import type {
  PostPlayerBody,
  DeletePlayerBody,
  PlayerListResponse,
  PlayerRecord,
} from "@/types/player";

/* ============================================================================
 * バリデーション
 * ============================================================================ */
function validatePlayerInput(name: string, rate: number): string | null {
  if (!name || !name.trim()) {
    return "プレイヤー名は必須です";
  }
  if (!Number.isFinite(rate)) {
    return "rate は数値である必要があります";
  }
  if (rate < 0) {
    return "rate は 0 以上である必要があります";
  }
  if (name.length > 100) {
    return "プレイヤー名が長すぎます（100文字以内）";
  }
  return null;
}

/* ============================================================================
 * GET: プレイヤー一覧取得
 * ============================================================================ */
export async function getPlayers(userId: string): Promise<PlayerListResponse> {
  const players = await prisma.player.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
  });

  return players;
}

/* ============================================================================
 * POST: プレイヤー新規登録
 * ============================================================================ */
export async function createPlayer(
  body: PostPlayerBody,
  targetUserId: string
) {
  const { name, rate } = body;

  const error = validatePlayerInput(name, rate);
  if (error) {
    return { error, status: 400 };
  }

  // 同名チェック（団体内ユニーク）
  const exists = await prisma.player.findFirst({
    where: {
      name,
      userId: targetUserId,
      deletedAt: null,
    },
  });

  if (exists) {
    return { error: "同名のプレイヤーが既に存在します", status: 409 };
  }

  const created = await prisma.player.create({
    data: {
      name: name.trim(),
      initialRate: rate,
      currentRate: rate,
      userId: targetUserId,
    },
  });

  return { data: created };
}

/* ============================================================================
 * DELETE: プレイヤー論理削除
 * ============================================================================ */
export async function deletePlayer(
  body: DeletePlayerBody,
  targetUserId: string
) {
  const { id } = body;

  if (!id) {
    return { error: "id は必須です", status: 400 };
  }

  const player = await prisma.player.findUnique({ where: { id } });

  if (!player || player.deletedAt) {
    return { error: "対象プレイヤーが存在しません", status: 404 };
  }

  if (player.userId !== targetUserId) {
    return { error: "このプレイヤーを削除する権限がありません", status: 403 };
  }

  const deleted = await prisma.player.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { data: deleted };
}
