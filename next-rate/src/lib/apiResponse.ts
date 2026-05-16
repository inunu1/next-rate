import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError, ApiResponse } from "@/types/api";

export { ApiSuccess, ApiError, ApiResponse };

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
