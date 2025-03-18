import { NextResponse } from "next/server";

// プレイヤー型の定義
interface Player {
  id: number;
  name: string;
  rating: number;
}

// プレイヤーデータ格納用のダミーデータベース
const players: Player[] = [];

export async function POST(req: Request) {
  try {
    const { name, rating } = await req.json();

    // バリデーション
    if (!name || !rating || isNaN(rating) || rating < 0) {
      return NextResponse.json(
        { message: "Invalid player data." },
        { status: 400 }
      );
    }

    // 新規プレイヤー追加
    const newPlayer: Player = {
      id: players.length + 1,
      name,
      rating,
    };

    players.push(newPlayer);

    return NextResponse.json({
      message: "Player registered successfully!",
      player: newPlayer,
    });
  } catch (error) {
    console.error("Error registering player:", error);
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
