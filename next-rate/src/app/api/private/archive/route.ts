import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(req: Request) {
  // Cron 用の秘密キー
  const cronKey = req.headers.get("x-cron-key")

  // ① Cron の場合（秘密キー一致）
  if (cronKey === process.env.CRON_SECRET_KEY) {
    return runArchive()
  }

  // ② 通常ユーザーの場合（NextAuth 認証）
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return runArchive()
}

// ------------------------------
// 実際のアーカイブ処理
// ------------------------------
async function runArchive() {
  try {
    // 1. Result を全件アーカイブ
    await prisma.result.updateMany({
      data: { archivedAt: new Date() }
    })

    return NextResponse.json({
      message: "Archived all results"
    })
  } catch (error) {
    console.error("Archive error:", error)
    return NextResponse.json(
      { error: "Archive failed" },
      { status: 500 }
    )
  }
}