export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type PostResultBody = {
  winnerId: string;
  winnerName: string;
  winnerRate: number;
  loserId: string;
  loserName: string;
  loserRate: number;
  matchDate: number;
  roundIndex: number;
  organizationId: string; // ★ 必須
};
