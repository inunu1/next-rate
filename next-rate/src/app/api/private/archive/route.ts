import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await prisma.result.updateMany({
      data: { archivedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: "全ての結果をアーカイブしました"
    })
  } catch (error) {
    console.error("Archive error:", error)
    return NextResponse.json(
      { success: false, error: "アーカイブに失敗しました" },
      { status: 500 }
    )
  }
}