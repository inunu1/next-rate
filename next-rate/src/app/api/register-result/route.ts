import { NextResponse } from "next/server";

// 試合結果の型
interface MatchResult {
  winnerId: number;
  loserId: number;
  winnerRating: number;
  loserRating: number;
  gameDate: string;
}

// ダミーデータベース
const results: MatchResult[] = [];

export async function POST(req: Request) {
  try {
    const { winnerId, loserId, winnerRating, loserRating, gameDate } =
      await req.json();

    // 簡易バリデーション
    if (
      !winnerId ||
      !loserId ||
      isNaN(winnerRating) ||
      isNaN(loserRating) ||
      !gameDate
    ) {
      return NextResponse.json(
        { message: "Invalid match result data." },
        { status: 400 }
      );
    }

    // 結果の登録
    const newResult: MatchResult = {
      winnerId,
      loserId,
      winnerRating,
      loserRating,
      gameDate,
    };

    results.push(newResult);

    return NextResponse.json({
      message: "Match result registered successfully!",
      result: newResult,
    });
  } catch (error) {
    console.error("Error registering result:", error);
    return NextResponse.json(
      { message: "Failed to register match result." },
      { status: 500 }
    );
  }
}
