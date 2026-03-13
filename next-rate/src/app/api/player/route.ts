/**
 * 【機能概要】
 * プレイヤー情報を扱う REST API。
 * 以下の 3 種類の処理を提供する。
 *
 * ① GET    /api/player?keyword=xxx
 *      - プレイヤー名の部分一致検索を行う
 *      - 削除済み（deletedAt != null）は対象外
 *      - 最大 20 件まで返却（パフォーマンス対策）
 *
 * ② POST   /api/player
 *      - プレイヤーの新規登録を行う
 *      - 初期レート(initialRate) を currentRate に反映
 *
 * ③ DELETE /api/player
 *      - プレイヤーの論理削除を行う
 *      - 削除日時(deletedAt) を設定し、以降の検索対象外とする
 *
 * 【前提条件】
 * ・プレイヤー名はユニークであることが望ましい（DB 制約は任意）
 * ・削除は論理削除のみ（物理削除は行わない）
 *
 * 【例外処理方針】
 * ・業務エラーは 400 番台、システムエラーは 500 番台で返却
 * ・ログにはスタックトレースを出力し、クライアントには簡易メッセージのみ返却
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
 * GET: プレイヤー検索処理
 * ============================================================ */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') ?? '';

    // ▼ キーワード未入力時は空配列を返却（負荷軽減）
    if (keyword.trim() === '') {
      return NextResponse.json([]);
    }

    // ▼ 部分一致検索（最大 20 件）
    const players = await prisma.player.findMany({
      where: {
        deletedAt: null,
        name: { contains: keyword },
      },
      orderBy: { currentRate: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        currentRate: true,
      },
    });

    // ▼ UI（AsyncSelect）向けの形式に変換
    return NextResponse.json(
      players.map((p) => ({
        value: p.id,
        label: `${p.name}（${p.currentRate}）`,
      }))
    );
  } catch (err) {
    console.error('GET /api/player error:', err);
    return NextResponse.json(
      { error: 'プレイヤー検索に失敗しました' },
      { status: 500 }
    );
  }
}

/* ============================================================
 * POST: プレイヤー新規登録処理
 * ============================================================ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, initialRate } = body;

    // ▼ 入力チェック（SIer では必須）
    if (!name || initialRate == null) {
      return NextResponse.json(
        { error: 'name と initialRate は必須です' },
        { status: 400 }
      );
    }

    // ▼ 新規登録（currentRate = initialRate）
    const created = await prisma.player.create({
      data: {
        name,
        initialRate,
        currentRate: initialRate,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/player error:', err);
    return NextResponse.json(
      { error: 'プレイヤー登録に失敗しました' },
      { status: 500 }
    );
  }
}

/* ============================================================
 * DELETE: プレイヤー論理削除処理
 * ============================================================ */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    // ▼ 入力チェック
    if (!id) {
      return NextResponse.json(
        { error: 'id は必須です' },
        { status: 400 }
      );
    }

    // ▼ 論理削除（deletedAt を設定）
    const deleted = await prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(deleted);
  } catch (err) {
    console.error('DELETE /api/player error:', err);
    return NextResponse.json(
      { error: 'プレイヤー削除に失敗しました' },
      { status: 500 }
    );
  }
}