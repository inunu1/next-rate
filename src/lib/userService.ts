/**
 * ============================================================================
 * 【ファイル名】
 * userService.ts
 *
 * 【機能概要】
 * 団体ユーザー（User）に関するビジネスロジックを集約するサービス層。
 *
 * 【役割】
 * - User API（/api/private/user）から呼び出される業務処理を担当
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
import type { PostUserBody, DeleteUserBody, UserListResponse } from "@/types/user";
import bcrypt from "bcryptjs";

/* ============================================================================
 * バリデーション
 * ============================================================================ */
function validateUserInput(body: PostUserBody): string | null {
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return "name, email, password, role は必須です";
  }

  if (!["owner", "admin", "editer", "viewer"].includes(role)) {
    return "role は owner, admin, editer, viewer のいずれかで指定してください";
  }

  return null;
}

/* ============================================================================
 * GET: 団体ユーザー一覧取得
 * ============================================================================ */
export async function getAllUsers(
  requesterRole: "owner" | "admin",
  requesterOrganizationId: string | null
): Promise<UserListResponse> {
  if (requesterRole === "owner") {
    return prisma.user.findMany({ orderBy: { name: "asc" } });
  }

  return prisma.user.findMany({
    where: { organizationId: requesterOrganizationId ?? undefined },
    orderBy: { name: "asc" },
  });
}

/* ============================================================================
 * POST: 団体ユーザー新規登録
 * ============================================================================ */
export async function createUser(
  body: PostUserBody,
  requesterRole: "owner" | "admin",
  requesterOrganizationId: string | null
) {
  // 入力チェック
  const error = validateUserInput(body);
  if (error) {
    return { error, status: 400 };
  }

  const { name, email, password, role, organizationId } = body;

  // email 重複チェック
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "既に登録済みの email です", status: 400 };
  }

  // ロールに応じた団体紐付けバリデーション
  if (role === "owner" && organizationId) {
    return { error: "owner は団体に所属できません", status: 400 };
  }

  if (role !== "owner") {
    if (!organizationId) {
      return { error: "admin/editer/viewer は organizationId が必須です", status: 400 };
    }

    if (requesterRole === "admin") {
      if (organizationId !== requesterOrganizationId) {
        return { error: "admin は自団体以外のユーザーを追加できません", status: 403 };
      }
    }
  }

  if (organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      return { error: "指定された団体が存在しません", status: 404 };
    }
  }

  // パスワードハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role,
      organizationId: organizationId ?? undefined,
    },
  });

  return { data: created };
}

/* ============================================================================
 * DELETE: 団体ユーザー削除
 * ============================================================================ */
export async function deleteUser(
  body: DeleteUserBody,
  requesterRole: "owner" | "admin",
  requesterOrganizationId: string | null
) {
  const { id } = body;

  if (!id) {
    return { error: "id は必須です", status: 400 };
  }

  // 存在チェック
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) {
    return { error: "対象ユーザーが存在しません", status: 404 };
  }

  if (requesterRole === "admin") {
    if (exists.organizationId !== requesterOrganizationId) {
      return { error: "admin は自団体以外のユーザーを削除できません", status: 403 };
    }
  }

  // 削除
  const deleted = await prisma.user.delete({
    where: { id },
  });

  return { data: deleted };
}
