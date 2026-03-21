/**
 * ============================================================
 * 【機能概要】
 * プレイヤー情報を扱う REST API。
 * 以下の 3 種類の処理を提供する。
 *
 * ① GET    /api/private/player
 *      - プレイヤー一覧を全件取得する
 *      - 削除済み（deletedAt != null）は対象外
 *      - 名前順で返却
 *
 * ② POST   /api/private/player
 *      - プレイヤーの新規登録を行う
 *      - currentRate = initialRate で初期化
 *
 * ③ DELETE /api/private/player
 *      - プレイヤーの論理削除を行う
 *      - deletedAt に削除日時を設定
 *
 * 【前提条件】
 * ・プレイヤー名はユニークであることが望ましい
 * ・削除は論理削除のみ
 *
 * 【例外処理方針】
 * ・業務エラー：400 番台
 * ・システムエラー：500 番台
 * ============================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
 * GET: プレイヤー全件取得
 * ============================================================ */
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error('GET /api/private/player error:', err);
    return NextResponse.json(
      { error: 'プレイヤー取得に失敗しました' },
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

    if (!name || initialRate == null) {
      return NextResponse.json(
        { error: 'name と initialRate は必須です' },
        { status: 400 }
      );
    }

    const created = await prisma.player.create({
      data: {
        name,
        initialRate,
        currentRate: initialRate,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/private/player error:', err);
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

    if (!id) {
      return NextResponse.json(
        { error: 'id は必須です' },
        { status: 400 }
      );
    }

    const deleted = await prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(deleted);
  } catch (err) {
    console.error('DELETE /api/private/player error:', err);
    return NextResponse.json(
      { error: 'プレイヤー削除に失敗しました' },
      { status: 500 }
    );
  }
}