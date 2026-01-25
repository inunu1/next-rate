import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Cron 専用 API（外部アクセスは middleware で遮断）
export async function GET() {
  try {
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