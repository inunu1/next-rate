/**
 * ============================================================
 * 【機能概要】
 * プレイヤー情報を管理する REST API。
 * 以下の 3 種類の処理を提供する。
 *
 * ① GET    /api/private/player?keyword=xxx
 *      - プレイヤー名の部分一致検索
 *      - keyword 未指定時は全件取得
 *      - 削除済み（deletedAt != null）は対象外
 *      - 検索時は最大 20 件まで返却（パフォーマンス対策）
 *
 * ② POST   /api/private/player
 *      - プレイヤーの新規登録
 *      - currentRate = initialRate で初期化
 *
 * ③ DELETE /api/private/player
 *      - プレイヤーの論理削除
 *      - deletedAt に削除日時を設定
 *
 * 【前提条件】
 * ・プレイヤー名はユニークであることが望ましい（DB 制約は任意）
 * ・削除は論理削除のみ（物理削除は行わない）
 *
 * 【例外処理方針】
 * ・業務エラー（入力不備など）は 400 番台
 * ・システムエラー（DB 障害など）は 500 番台
 * ・ログには詳細（スタックトレース）を出力し、
 *   クライアントには簡易メッセージのみ返却する
 * ============================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
 * GET: プレイヤー検索 / 全件取得
 * ------------------------------------------------------------
 * 【処理概要】
 * ・keyword 未指定 → 全件取得
 * ・keyword 空文字 → 空配列（負荷軽減）
 * ・keyword 指定 → 部分一致検索（最大 20 件）
 *
 * 【戻り値】
 * ・全件取得時：Player[]
 * ・検索時：AsyncSelect 用 { value, label }[]
 * ============================================================
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword');

    // ▼ keyword 未指定 → 全件取得
    if (!keyword) {
      const players = await prisma.player.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(players);
    }

    // ▼ keyword 空文字 → 空配列（負荷軽減）
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

    // ▼ UI（AsyncSelect）向け形式に変換
    return NextResponse.json(
      players.map((p) => ({
        value: p.id,
        label: `${p.name}（${p.currentRate}）`,
      }))
    );
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
 * ------------------------------------------------------------
 * 【処理概要】
 * ・name, initialRate を受け取り新規登録
 * ・currentRate = initialRate で初期化
 *
 * 【入力項目】
 * ・name: string（必須）
 * ・initialRate: number（必須）
 *
 * 【戻り値】
 * ・作成された Player オブジェクト
 * ============================================================
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, initialRate } = body;

    // ▼ 入力チェック
    if (!name || initialRate == null) {
      return NextResponse.json(
        { error: 'name と initialRate は必須です' },
        { status: 400 }
      );
    }

    // ▼ 新規登録
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
 * ------------------------------------------------------------
 * 【処理概要】
 * ・id を受け取り deletedAt を設定
 *
 * 【入力項目】
 * ・id: string（必須）
 *
 * 【戻り値】
 * ・更新後の Player オブジェクト
 * ============================================================
 */
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

    // ▼ 論理削除
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