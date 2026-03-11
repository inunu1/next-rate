/**
 * プレイヤー検索 API（REST）
 * GET /api/player?keyword=xxx
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') ?? '';

    if (keyword.trim() === '') {
      return NextResponse.json([]);
    }

    const players = await prisma.player.findMany({
      where: {
        deletedAt: null,
        name: { contains: keyword },
      },
      orderBy: { currentRate: 'desc' },
      take: 20, // ★ 1万件でも軽い
      select: {
        id: true,
        name: true,
        currentRate: true,
      },
    });

    // ★ AsyncSelect 用に変換
    return NextResponse.json(
      players.map((p) => ({
        value: p.id,
        label: `${p.name}（${p.currentRate}）`,
      }))
    );
  } catch (err) {
    console.error('GET /api/player error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}