/**
 * ============================================================
 * 【機能概要】
 * 団体ユーザー（User）を扱う REST API。
 * owner（サービス運営者）のみ利用可能。
 *
 * ① GET    /api/private/user
 *      - 全団体ユーザー一覧を取得（owner 専用）
 *
 * ② POST   /api/private/user
 *      - 団体ユーザーの新規登録（owner 専用）
 *      - email 重複チェック
 *      - パスワードは bcrypt でハッシュ化
 *
 * ③ DELETE /api/private/user
 *      - 団体ユーザーの物理削除（owner 専用）
 *
 * 【前提条件】
 * ・User.role は owner / admin の 2 種類
 * ・admin は User API を利用しない
 * ・owner のみ団体管理を行う
 * ============================================================
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
 * owner 専用チェック
 * ============================================================ */
async function requireOwner() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (session.user.role !== 'owner') {
    return { error: '権限がありません（owner のみ利用可能）', status: 403 };
  }

  return { session };
}

/* ============================================================
 * GET: 全団体ユーザー一覧（owner 専用）
 * ============================================================ */
export async function GET() {
  const auth = await requireOwner();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
 * POST: 団体ユーザー新規登録（owner 専用）
 * ============================================================ */
export async function POST(req: Request) {
  const auth = await requireOwner();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'name, email, password, role は必須です' },
        { status: 400 }
      );
    }

    if (!['owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'role は owner または admin のみ指定可能です' },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: '既に登録済みの email です' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role,
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
 * DELETE: 団体ユーザー削除（owner 専用）
 * ============================================================ */
export async function DELETE(req: Request) {
  const auth = await requireOwner();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id は必須です' },
        { status: 400 }
      );
    }

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
