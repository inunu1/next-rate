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

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jsonOk, jsonError } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuthOwnerResult = { session: Awaited<ReturnType<typeof getServerSession>> } | { error: string; status: number };

/* ============================================================
 * owner 専用チェック
 * ============================================================ */
async function requireOwner(): Promise<AuthOwnerResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (session.user.systemRole !== 'owner') {
    return { error: '権限がありません（owner のみ利用可能）', status: 403 };
  }

  return { session };
}

/* ============================================================
 * GET: 全団体ユーザー一覧（owner 専用）
 * ============================================================ */
export async function GET() {
  const auth = await requireOwner();
  if ('error' in auth) {
    return jsonError(auth.error, auth.status);
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    return jsonOk(users);
  } catch (err) {
    console.error('GET /api/private/user error:', err);
    return jsonError('団体ユーザー取得に失敗しました', 500);
  }
}

/* ============================================================
 * POST: 団体ユーザー新規登録（owner 専用）
 * ============================================================ */
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) {
    return jsonError(auth.error, auth.status);
  }

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return jsonError('name, email, password, role は必須です', 400);
    }

    if (!['owner', 'admin'].includes(role)) {
      return jsonError('role は owner または admin のみ指定可能です', 400);
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return jsonError('既に登録済みの email です', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        systemRole: role,
      },
    });

    return jsonOk(created);
  } catch (err) {
    console.error('POST /api/private/user error:', err);
    return jsonError('団体ユーザー登録に失敗しました', 500);
  }
}

/* ============================================================
 * DELETE: 団体ユーザー削除（owner 専用）
 * ============================================================ */
export async function DELETE(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) {
    return jsonError(auth.error, auth.status);
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return jsonError('id は必須です', 400);
    }

    const deleted = await prisma.user.delete({
      where: { id },
    });

    return jsonOk(deleted);
  } catch (err) {
    console.error('DELETE /api/private/user error:', err);
    return jsonError('団体ユーザー削除に失敗しました', 500);
  }
}
