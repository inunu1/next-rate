import { NextResponse } from "next/server";

// ダミーデータベース
const players: any[] = [];

export async function POST(req: Request) {
  try {
    const { name, rating } = await req.json();

    // 簡易バリデーション
    if (!name || !rating || isNaN(rating) || rating < 0) {
      return NextResponse.json(
        { message: "Invalid player data." },
        { status: 400 }
      );
    }

    // プレイヤー情報を保存（ダミーデータベース）
    players.push({ id: players.length + 1, name, rating });
    return NextResponse.json({
      message: "Player registered successfully!",
      player: { name, rating },
    });
  } catch (error) {
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
