import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const K_FACTOR = 32;

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // --- 1) 全プレイヤーを初期レートにリセット（メモリ上） ---
    const players = await prisma.player.findMany();
    const playerMap = new Map<string, PlayerState>(
      players.map((p) => [
        p.id,
        { id: p.id, initialRate: p.initialRate, currentRate: p.initialRate },
      ])
    );

    // --- 2) 全試合を日時昇順で取得 ---
    const results = await prisma.result.findMany({
      orderBy: { playedAt: 'asc' },
    });

    // --- 3) 全件再計算 ---
    const resultUpdates: ResultUpdate[] = [];

    for (const r of results) {
      const winner = playerMap.get(r.winnerId);
      const loser = playerMap.get(r.loserId);
      if (!winner || !loser) continue;

      const winnerStart = winner.currentRate;
      const loserStart = loser.currentRate;

      const { winnerNext, loserNext } = calcNext(winnerStart, loserStart);

      resultUpdates.push({
        id: r.id,
        winnerRate: winnerStart,
        loserRate: loserStart,
      });

      winner.currentRate = winnerNext;
      loser.currentRate = loserNext;
    }

    // --- 4) I/O 最適化：Result と Player をバルク更新 ---
    const resultValues = resultUpdates
      .map(
        (u) =>
          `('${u.id}', ${u.winnerRate}, ${u.loserRate})`
      )
      .join(',');

    const playerValues = Array.from(playerMap.values())
      .map((p) => `('${p.id}', ${p.currentRate})`)
      .join(',');

    await prisma.$transaction([
      // Result の winnerRate / loserRate を一括更新
      prisma.$executeRawUnsafe(`
        UPDATE "Result" AS r
        SET "winnerRate" = c."winnerRate",
            "loserRate" = c."loserRate"
        FROM (VALUES ${resultValues}) AS c(id, "winnerRate", "loserRate")
        WHERE r.id = c.id;
      `),

      // Player の currentRate を一括更新
      prisma.$executeRawUnsafe(`
        UPDATE "Player" AS p
        SET "currentRate" = c."currentRate"
        FROM (VALUES ${playerValues}) AS c(id, "currentRate")
        WHERE p.id = c.id;
      `),
    ]);

    return NextResponse.json({ message: 'レーティング計算完了（I/O 最適化版）' });
  } catch (error) {
    console.error('レーティング計算エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}