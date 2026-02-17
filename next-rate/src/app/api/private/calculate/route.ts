
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// --- 定数 ---
const K_FACTOR = 32; // レーティング計算用定数

// --- 型定義 ---
interface PlayerState {
  id: string;
  initialRate: number;
  currentRate: number;
}

interface ResultUpdate {
  id: string;
  winnerRate: number;
  loserRate: number;
}

// --- レーティング計算関数 ---
function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function calcNext(winnerRate: number, loserRate: number) {
  const ew = expectedScore(winnerRate, loserRate);
  const el = expectedScore(loserRate, winnerRate);
  return {
    winnerNext: Math.round(winnerRate + K_FACTOR * (1 - ew)),
    loserNext: Math.round(loserRate + K_FACTOR * (0 - el)),
  };
}

export async function POST() {
  // --- 認証チェック（private API の必須条件） ---
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // --- 1) 全プレイヤーを初期レートにリセット（メモリ上） ---
    const players = await prisma.player.findMany();
    const playerMap = new Map<string, PlayerState>(
      players.map((p) => [p.id, { id: p.id, initialRate: p.initialRate, currentRate: p.initialRate }])
    );

    // --- 2) 全試合を日時昇順で取得 ---
    const results = await prisma.result.findMany({
      orderBy: { playedAt: 'asc' },
    });

    // --- 3) 各試合を順に再計算 ---
    const resultUpdates: ResultUpdate[] = [];
    for (const r of results) {
      const winner = playerMap.get(r.winnerId);
      const loser = playerMap.get(r.loserId);
      if (!winner || !loser) continue; // プレイヤーが見つからない場合はスキップ

      const winnerStart = winner.currentRate;
      const loserStart = loser.currentRate;

      const { winnerNext, loserNext } = calcNext(winnerStart, loserStart);

      // この試合時点のレートを記録
      resultUpdates.push({
        id: r.id,
        winnerRate: winnerStart,
        loserRate: loserStart,
      });

      // 次の試合用にレートを更新
      winner.currentRate = winnerNext;
      loser.currentRate = loserNext;
    }

    // --- 4) 一括更新（トランザクション） ---
    await prisma.$transaction([
      ...resultUpdates.map((u) =>
        prisma.result.update({
          where: { id: u.id },
          data: { winnerRate: u.winnerRate, loserRate: u.loserRate },
        })
      ),
      ...Array.from(playerMap.values()).map((p) =>
        prisma.player.update({
          where: { id: p.id },
          data: { currentRate: p.currentRate },
        })
      ),
    ]);

    return NextResponse.json({
      message: 'レーティング計算完了',
    });
  } catch (error) {
    // --- エラーハンドリング ---
    console.error('レーティング計算エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}