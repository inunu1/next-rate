import { prisma } from '@/lib/prisma';          // Prismaクライアントをインポート（DB操作用）
import { NextResponse } from 'next/server';    // Next.jsのAPIレスポンスユーティリティをインポート

const K = 32;                                  // Eloレーティングの変動係数（調整可能）

function expectedScore(rA: number, rB: number) {
  // プレイヤーAの期待勝率を計算する関数
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

function calculateNewRatings(winnerRate: number, loserRate: number) {
  // 勝者と敗者の新しいレートを計算する関数
  const expectedWinner = expectedScore(winnerRate, loserRate); // 勝者の期待勝率
  const expectedLoser = expectedScore(loserRate, winnerRate);  // 敗者の期待勝率

  // 勝者の新レート = 現在レート + K * (実際の勝ち - 期待勝率)
  const newWinnerRate = Math.round(winnerRate + K * (1 - expectedWinner));
  // 敗者の新レート = 現在レート + K * (実際の負け - 期待勝率)
  const newLoserRate = Math.round(loserRate + K * (0 - expectedLoser));

  return { newWinnerRate, newLoserRate };      // 新しいレートを返す
}

export async function POST() {
  // APIエンドポイント: POSTメソッドで呼び出されるとレーティング再計算を実行

  // 1) 初期レートを全プレイヤーに復元
  const players = await prisma.player.findMany();
  for (const player of players) {
    await prisma.player.update({
      where: { id: player.id },
      data: { currentRate: player.initialRate },
    });
  }

  // 2) 試合履歴を日時順に取得
  const results = await prisma.result.findMany({
    orderBy: { playedAt: 'asc' },
  });

  // 3) 試合順にレートを再計算
  for (const result of results) {
    const winner = await prisma.player.findUnique({ where: { id: result.winnerId } });
    const loser = await prisma.player.findUnique({ where: { id: result.loserId } });

    if (!winner || !loser) continue;

    // この試合の開始時点レート（適用前）
    const winnerStartRate = winner.currentRate;
    const loserStartRate = loser.currentRate;

    // 結果テーブルを更新（開始時点レートを保存）
    await prisma.result.update({
      where: { id: result.id },
      data: {
        winnerRate: winnerStartRate, // ←開始時点レートを保存
        loserRate: loserStartRate,   // ←開始時点レートを保存
      },
    });

    // 終了時点のレートを計算
    const { newWinnerRate, newLoserRate } = calculateNewRatings(
      winnerStartRate,
      loserStartRate
    );

    // プレイヤーの現在レートを更新（終了時点）
    await prisma.player.update({
      where: { id: winner.id },
      data: { currentRate: newWinnerRate },
    });
    await prisma.player.update({
      where: { id: loser.id },
      data: { currentRate: newLoserRate },
    });
  }

  // 4) 処理完了レスポンスを返す
  return NextResponse.json({ message: '開始時点レートを再計算して更新しました' });
}