import { NextResponse } from "next/server";

// ダミーデータベース
const users: any[] = [];

export async function POST(req: Request) {
  try {
    const { name, email, password, password_confirmation } = await req.json();

    // 簡易バリデーション
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }
    if (password !== password_confirmation) {
      return NextResponse.json(
        { message: "Passwords do not match." },
        { status: 400 }
      );
    }

    // ユーザー情報を保存（ダミー）
    users.push({ name, email, password });
    return NextResponse.json({ message: "User registered successfully!" });
  } catch (error) {
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
