/**
 * 対局結果：日付一覧取得API
 * ------------------------------------------------------------
 * 【業務概要】
 * ・対局が行われた全日付（matchDate）の一覧を返却する。
 * ・DB の保持形式（数値：YYYYMMDD）をそのまま返す。
 *
 * 【注意事項】
 * ・画面側で表示形式（YYYY/MM/DD）への変換を行う。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dates = await prisma.result.findMany({
      select: { matchDate: true },
      distinct: ["matchDate"],
      orderBy: { matchDate: "asc" },
    });

    return NextResponse.json({
      dates: dates.map((d) => d.matchDate),
    });

  } catch (error) {
    console.error("【ERROR】/api/result/dates:", error);
    return NextResponse.json(
      { error: "日付一覧の取得に失敗しました。" },
      { status: 500 }
    );
  }
}