import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const K_FACTOR = 32;

// メモリ上で扱うプレイヤーの状態
interface PlayerState {
  id: string;
  initialRate: number;
  currentRate: number;
}

// Result テーブルに書き戻すためのレート履歴
interface ResultUpdate {
  id: string;
  winnerRate: number;
  loserRate: number;
}

// 期待勝率の計算（Elo の基本式）
function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

// 勝者・敗者の次のレートを計算
function calcNext(winnerRate: number, loserRate: number) {
  const ew = expectedScore(winnerRate, loserRate);
  const el = expectedScore(loserRate, winnerRate);
  return {
    winnerNext: Math.round(winnerRate + K_FACTOR * (1 - ew)),
    loserNext: Math.round(loserRate + K_FACTOR * (0 - el)),
  };
}

export async function POST() {
  // 認証チェック（NextAuth）
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ------------------------------------------------------------
    // 1) プレイヤーをメモリ上にロードし、全員を初期レートにリセット
    // ------------------------------------------------------------
    const players = await prisma.player.findMany();

    // Map にして O(1) でアクセスできるようにする
    const playerMap = new Map<string, PlayerState>(
      players.map((p) => [
        p.id,
        { id: p.id, initialRate: p.initialRate, currentRate: p.initialRate },
      ])
    );

    // ------------------------------------------------------------
    // 2) 全試合を playedAt 昇順で取得（Elo は時系列依存）
    // ------------------------------------------------------------
    const results = await prisma.result.findMany({
      orderBy: { playedAt: 'asc' },
    });

    // Result に書き戻す winnerRate / loserRate の履歴
    const resultUpdates: ResultUpdate[] = [];

    // 今回の計算でレートが変わったプレイヤーだけを記録（差分更新用）
    const touchedPlayers = new Set<string>();

    // ------------------------------------------------------------
    // 3) 全試合を順番に処理してレートを再計算
    // ------------------------------------------------------------
    for (const r of results) {
      const winner = playerMap.get(r.winnerId);
      const loser = playerMap.get(r.loserId);

      // ありえないが念のため
      if (!winner || !loser) continue;

      // 対局前のレート（Result に保存するため）
      const winnerStart = winner.currentRate;
      const loserStart = loser.currentRate;

      // 次のレートを計算
      const { winnerNext, loserNext } = calcNext(winnerStart, loserStart);

      // Result テーブルに書き戻すための履歴を保存
      resultUpdates.push({
        id: r.id,
        winnerRate: winnerStart,
        loserRate: loserStart,
      });

      // メモリ上のレートを更新
      winner.currentRate = winnerNext;
      loser.currentRate = loserNext;

      // 差分更新対象として記録
      touchedPlayers.add(winner.id);
      touchedPlayers.add(loser.id);
    }

    // 対局が 0 件なら何もしない
    if (resultUpdates.length === 0) {
      return NextResponse.json({
        message: '対局が存在しないため、レーティング計算はスキップされました。',
      });
    }

    // ------------------------------------------------------------
    // 4) バルク UPDATE 用の VALUES を生成
    //    ※ここが I/O 最適化の本丸
    // ------------------------------------------------------------

    // Result の winnerRate / loserRate を全件更新する VALUES
    const resultValues = resultUpdates
      .map(
        (u) =>
          `('${u.id}', ${u.winnerRate}, ${u.loserRate})`
      )
      .join(',');

    // ★差分更新：レートが変わったプレイヤーだけ VALUES に含める
    const playerValues = Array.from(touchedPlayers)
      .map((id) => {
        const p = playerMap.get(id)!;
        return `('${p.id}', ${p.currentRate})`;
      })
      .join(',');

    // ------------------------------------------------------------
    // 5) Prisma のトランザクションで 2 クエリだけ実行
    //    - Result のバルク UPDATE（10000 行でも 1 クエリ）
    //    - Player の差分バルク UPDATE（必要な行だけ）
    // ------------------------------------------------------------
    await prisma.$transaction([
      // Result の winnerRate / loserRate を一括更新
      prisma.$executeRawUnsafe(`
        UPDATE "Result" AS r
        SET "winnerRate" = c."winnerRate",
            "loserRate" = c."loserRate"
        FROM (VALUES ${resultValues}) AS c(id, "winnerRate", "loserRate")
        WHERE r.id = c.id;
      `),

      // Player の currentRate を差分だけ一括更新
      prisma.$executeRawUnsafe(`
        UPDATE "Player" AS p
        SET "currentRate" = c."currentRate"
        FROM (VALUES ${playerValues}) AS c(id, "currentRate")
        WHERE p.id = c.id;
      `),
    ]);

    // ------------------------------------------------------------
    // 6) 完了レスポンス
    // ------------------------------------------------------------
    return NextResponse.json({
      message: 'レーティング計算完了（差分更新＋バルクUPDATE版）',
    });
  } catch (error) {
    console.error('レーティング計算エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}