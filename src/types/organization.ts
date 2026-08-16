/**
 * ============================================================================
 * 【ファイル名】
 * organization.ts
 *
 * 【機能概要】
 * 団体（Organization）に関する型定義を集約する。
 * ============================================================================
 */

export type OrganizationOption = {
  value: string;
  label: string;
};

export type OrganizationSummary = {
  id: string;
  name: string | null;
};

export type PostOrganizationBody = {
  /** 団体名 */
  name: string;
};

export type DeleteOrganizationBody = {
  /** 削除対象団体の ID */
  id: string;
};

export type OrganizationRecord = OrganizationSummary & {
  createdAt: string;
  updatedAt: string;
};

export type OrganizationListResponse = OrganizationRecord[];
