/**
 * ============================================================================
 * 【ファイル名】
 * organization.ts
 *
 * 【機能概要】
 * 団体（Organization）に関する型定義を集約する。
 * ============================================================================
 */

export type PostOrganizationBody = {
  /** 団体名 */
  name: string;
};

export type DeleteOrganizationBody = {
  /** 削除対象団体の ID */
  id: string;
};

export type OrganizationRecord = {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationListResponse = OrganizationRecord[];
