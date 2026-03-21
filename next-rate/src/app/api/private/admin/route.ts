/**
 * ============================================================
 * 【機能概要】
 * 管理ユーザー（Admin）を扱う REST API。
 * 以下の 3 種類の処理を提供する。
 *
 * ① GET    /api/private/admin
 *      - 管理ユーザー一覧を取得する
 *      - 削除概念は存在しないため全件取得
 *
 * ② POST   /api/private/admin
 *      - 管理ユーザーの新規登録を行う
 *      - email の重複チェックを実施
 *      - パスワードは bcrypt にてハッシュ化して保存
 *
 * ③ DELETE /api/private/admin
 *      - 管理ユーザーの物理削除を行う
 *      - 関連データが存在しない前提で物理削除を許可
 *
 * 【前提条件】
 * ・email はユニークであること（DB 制約推奨）
 * ・パスワードは平文で保存しない
 * ・管理ユーザーは論理削除を行わない（業務要件）
 *
 * 【例外処理方針】
 * ・業務エラー：400 番台
 * ・システムエラー：500 番台
 * ・ログには詳細を出力し、レスポンスは簡易メッセージとする
 *
 * 【設計方針】
 * ・API は DB アクセスの唯一の入口とする
 * ・Client Component は fetch のみを行い、DB には直接触れない
 * ============================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
 * GET: 管理ユーザー全件取得
 * ============================================================ */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('GET /api/private/admin error:', err);
    return NextResponse.json(
      { error: '管理ユーザー取得に失敗しました' },
      { status: 500 }
    );
  }
}

/* ============================================================
 * POST: 管理ユーザー新規登録処理
 * ============================================================ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // ▼ 入力チェック（SIer では必須）
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'name, email, password は必須です' },
        { status: 400 }
      );
    }

    // ▼ email 重複チェック
    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { error: '既に登録済みの email です' },
        { status: 400 }
      );
    }

    // ▼ パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ▼ 新規登録
    const created = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/private/admin error:', err);
    return NextResponse.json(
      { error: '管理ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}

/* ============================================================
 * DELETE: 管理ユーザー物理削除処理
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

    // ▼ 物理削除（関連データがない前提）
    const deleted = await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (err) {
    console.error('DELETE /api/private/admin error:', err);
    return NextResponse.json(
      { error: '管理ユーザー削除に失敗しました' },
      { status: 500 }
    );
  }
}