/**
 * ============================================================
 * 【機能概要】
 * 団体ユーザー（User）を扱う REST API。
 * 以下の 3 種類の処理を提供する。
 *
 * ① GET    /api/private/user
 *      - 団体ユーザー一覧を取得する
 *
 * ② POST   /api/private/user
 *      - 団体ユーザーの新規登録を行う
 *      - email の重複チェックを実施
 *      - パスワードは bcrypt にてハッシュ化して保存
 *      - role（owner / admin）を入力で指定可能
 *
 * ③ DELETE /api/private/user
 *      - 団体ユーザーの物理削除を行う
 *
 * 【前提条件】
 * ・User.role は Prisma の enum により必須（owner / admin）
 * ・email はユニーク
 * ・パスワードは平文で保存しない
 *
 * ============================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
 * GET: 団体ユーザー全件取得
 * ============================================================ */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('GET /api/private/user error:', err);
    return NextResponse.json(
      { error: '団体ユーザー取得に失敗しました' },
      { status: 500 }
    );
  }
}

/* ============================================================
 * POST: 団体ユーザー新規登録処理（owner/admin 両対応）
 * ============================================================ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    // ▼ 入力チェック
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'name, email, password, role は必須です' },
        { status: 400 }
      );
    }

    // ▼ role の妥当性チェック
    if (!['owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'role は owner または admin のみ指定可能です' },
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

    // ▼ 新規登録（owner/admin 両対応）
    const created = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role, // ★ ここが重要
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/private/user error:', err);
    return NextResponse.json(
      { error: '団体ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}

/* ============================================================
 * DELETE: 団体ユーザー物理削除処理
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

    // ▼ 物理削除
    const deleted = await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (err) {
    console.error('DELETE /api/private/user error:', err);
    return NextResponse.json(
      { error: '団体ユーザー削除に失敗しました' },
      { status: 500 }
    );
  }
}
