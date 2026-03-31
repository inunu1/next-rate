import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Result } from "@prisma/client";

/* ============================================================================
 * GET: 対局結果の取得（matchDate + roundIndex）
 * ----------------------------------------------------------------------------
 * 【業務概要】
 * ・指定された日付（YYYY-MM-DD）の対局結果一覧を返却する。
 * ・日付未指定の場合は「最新日付」を返却する。
 *
 * 【非責務】
 * ・前後日付の計算（画面側で dates API を使用）
 * ・プレイヤー絞り込み（画面側で実施）
 * ========================================================================== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD

  /* -------------------------------------------------------------------------
   * ① targetMatchDate の決定
   * ----------------------------------------------------------------------- */
  let targetMatchDate: number;

  if (dateStr) {
    // YYYY-MM-DD → YYYYMMDD（数値）
    targetMatchDate = Number(dateStr.replaceAll("-", ""));
  } else {
    // 最新日付を取得（生 SQL）
    const latest = await prisma.$queryRaw<
      { matchDate: number }[]
    >`SELECT DISTINCT "matchDate" FROM "Result" ORDER BY "matchDate" DESC LIMIT 1`;

    if (latest.length === 0) {
      return NextResponse.json({
        date: null,
        results: [],
      });
    }

    targetMatchDate = latest[0].matchDate;
  }

  /* -------------------------------------------------------------------------
   * ② 対局データ取得（生 SQL）
   * ----------------------------------------------------------------------- */
  const results = await prisma.$queryRaw<Result[]>`
    SELECT *
    FROM "Result"
    WHERE "matchDate" = ${targetMatchDate}
    ORDER BY "roundIndex" ASC
  `;

  /* -------------------------------------------------------------------------
   * ③ レスポンス
   * ----------------------------------------------------------------------- */
  const s = targetMatchDate.toString();
  const yyyy_mm_dd = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

  return NextResponse.json({
    date: yyyy_mm_dd,
    results,
  });
}

/* ============================================================================
 * POST: 対局結果の登録
 * ========================================================================== */
export async function POST(req: Request) {
  const body = await req.json();

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

  /* -------------------------------------------------------------------------
   * ① 必須チェック
   * ----------------------------------------------------------------------- */
  if (!winnerId || !loserId || !matchDate || !roundIndex) {
    return NextResponse.json(
      { error: "必須項目が不足しています" },
      { status: 400 }
    );
  }

  /* -------------------------------------------------------------------------
   * ② 業務バリデーション（同一ラウンド重複）
   * ----------------------------------------------------------------------- */
  const conflict = await prisma.result.findFirst({
    where: {
      matchDate,
      roundIndex,
      OR: [{ winnerId }, { loserId }],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "同一ラウンドで既に対局済みのプレイヤーが含まれています" },
      { status: 409 }
    );
  }

  /* -------------------------------------------------------------------------
   * ③ 登録処理
   * ----------------------------------------------------------------------- */
  const result = await prisma.result.create({
    data: {
      winnerId,
      winnerName,
      winnerRate,
      loserId,
      loserName,
      loserRate,
      matchDate,
      roundIndex,
    },
  });

  return NextResponse.json(result);
}

/* ============================================================================
 * DELETE: 対局結果の削除
 * ========================================================================== */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id が必要です" },
      { status: 400 }
    );
  }

  await prisma.result.delete({ where: { id } });

  return NextResponse.json({ success: true });
}