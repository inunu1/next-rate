/**
 * ============================================================================
 * 【ファイル名】
 * organizationService.ts
 *
 * 【機能概要】
 * 団体（Organization）に関するビジネスロジックを集約するサービス層。
 *
 * 【役割】
 * - Organization API から呼び出される業務処理を担当
 * - Prisma アクセスを一元化し、API 層を薄く保つ
 * - バリデーション・重複チェック・整形処理を担当
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import type {
  PostOrganizationBody,
  DeleteOrganizationBody,
  OrganizationListResponse,
} from "@/types/organization";

/* ============================================================================
 * バリデーション
 * ============================================================================ */
function validateOrganizationInput(body: PostOrganizationBody): string | null {
  if (!body.name || !body.name.trim()) {
    return "団体名は必須です";
  }
  if (body.name.trim().length > 100) {
    return "団体名が長すぎます（100文字以内）";
  }
  return null;
}

/* ============================================================================
 * GET: 団体一覧取得
 * ============================================================================ */
export async function getOrganizations(): Promise<OrganizationListResponse> {
  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
  });
  return organizations.map((organization) => ({
    ...organization,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  }));
}

/* ============================================================================
 * POST: 団体新規登録
 * ============================================================================ */
export async function createOrganization(body: PostOrganizationBody) {
  const error = validateOrganizationInput(body);
  if (error) {
    return { error, status: 400 };
  }

  const exists = await prisma.organization.findFirst({
    where: { name: body.name.trim() },
  });
  if (exists) {
    return { error: "同名の団体が既に存在します", status: 409 };
  }

  const created = await prisma.organization.create({
    data: {
      name: body.name.trim(),
    },
  });

  return { data: created };
}

/* ============================================================================
 * DELETE: 団体削除
 * ============================================================================ */
export async function deleteOrganization(body: DeleteOrganizationBody) {
  const { id } = body;
  if (!id) {
    return { error: "id は必須です", status: 400 };
  }

  const exists = await prisma.organization.findUnique({ where: { id } });
  if (!exists) {
    return { error: "対象団体が存在しません", status: 404 };
  }

  await prisma.organization.delete({ where: { id } });
  return { data: { success: true } };
}
