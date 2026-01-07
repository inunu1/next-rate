// Next.js のレスポンスユーティリティ
import { NextResponse } from "next/server";

// NextAuth のセッション取得
import { getServerSession } from "next-auth";

// Prisma クライアント
import { prisma } from "@/lib/prisma";

// -------------------------------------------------------------
// Prisma モデルを動的に取得する関数
// 例: table = "player" → prisma.player を返す
// -------------------------------------------------------------
const getModel = (table: string) => {
  const model = (prisma as any)[table]; // Prisma のモデル名を動的に参照
  if (!model) throw new Error(`Unknown table: ${table}`); // モデルが存在しない場合はエラー
  return model;
};


// -------------------------------------------------------------
// CRUD 実装（論理削除は update、物理削除は delete）
// -------------------------------------------------------------
const crud = {
  // ---------------------------------------------------------
  // 一覧取得（findMany）
  // select が指定されていれば必要な列だけ返す
  // ---------------------------------------------------------
  async list(table: string, select?: any) {
    const model = getModel(table); // モデル取得
    return model.findMany({ select }); // 全件取得
  },

  // ---------------------------------------------------------
  // 単一取得（findUnique）
  // id と select を指定可能
  // ---------------------------------------------------------
  async get(table: string, id: string, select?: any) {
    const model = getModel(table);
    return model.findUnique({ where: { id }, select });
  },

  // ---------------------------------------------------------
  // 新規作成（create）
  // data に渡された内容をそのまま登録
  // ---------------------------------------------------------
  async create(table: string, data: any) {
    const model = getModel(table);
    return model.create({ data });
  },

  // ---------------------------------------------------------
  // 更新（update）
  // 論理削除もここで扱う（deletedAt を渡せば OK）
  // ---------------------------------------------------------
  async update(table: string, id: string, data: any) {
    const model = getModel(table);
    return model.update({
      where: { id },
      data,
    });
  },

  // ---------------------------------------------------------
  // 物理削除（delete）
  // 対局結果管理などで使用
  // ---------------------------------------------------------
  async delete(table: string, id: string) {
    const model = getModel(table);
    return model.delete({
      where: { id },
    });
  }
};


// -------------------------------------------------------------
// API 本体（POST 1 本で全ドメインを扱う）
// -------------------------------------------------------------
export async function POST(req: Request) {
  // ---------------------------------------------------------
  // NextAuth のセッションチェック
  // 未ログインなら 401 を返す
  // ---------------------------------------------------------
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // -------------------------------------------------------
    // クライアントから送られた JSON を取得
    // action: CRUD の種類
    // table: Prisma モデル名
    // id: 対象レコード
    // data: 更新・作成データ
    // select: 取得する列
    // -------------------------------------------------------
    const { action, table, id, data, select } = await req.json();

    // -------------------------------------------------------
    // action に応じて処理を振り分ける
    // -------------------------------------------------------
    switch (action) {
      case "list":
        return NextResponse.json(await crud.list(table, select));

      case "get":
        return NextResponse.json(await crud.get(table, id, select));

      case "create":
        return NextResponse.json(await crud.create(table, data));

      case "update": // ★ 論理削除もここで扱う
        return NextResponse.json(await crud.update(table, id, data));

      case "delete": // ★ 物理削除
        return NextResponse.json(await crud.delete(table, id));

      default:
        // 未定義の action が来た場合
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (err: any) {
    // -------------------------------------------------------
    // 予期せぬエラーは 500 として返す
    // -------------------------------------------------------
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}