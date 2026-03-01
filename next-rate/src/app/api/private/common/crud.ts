import { getModel, TableName } from "./model";
import { createUser } from "./user";
import { prisma } from "@/lib/prisma";
import type { Result } from "@prisma/client";

export type SelectFields = Record<string, boolean> | undefined;
export type DataFields = Record<string, unknown>;

export type ApiRequest = {
  action: "list" | "get" | "create" | "update" | "delete";
  table: TableName;
  id?: string;
  data?: DataFields;
  select?: SelectFields;
};

export const crud = {
  async list(table: TableName, select?: SelectFields) {
    return getModel(table).findMany({ select });
  },

  async get(table: TableName, id: string, select?: SelectFields) {
    return getModel(table).findUnique({ where: { id }, select });
  },

  async create(table: TableName, data: DataFields) {
    return getModel(table).create({ data });
  },

  async update(table: TableName, id: string, data: DataFields) {
    return getModel(table).update({ where: { id }, data });
  },

  async delete(table: TableName, id: string) {
    return getModel(table).delete({ where: { id } });
  },
};

/**
 * 対局登録・削除後に、その対局以降の isCalculated を false に戻す。
 * 差分計算の境界を作る業務ロジック。
 */
async function invalidateAfter(playedAt: Date) {
  await prisma.result.updateMany({
    where: {
      playedAt: { gte: playedAt },
    },
    data: {
      isCalculated: false,
    },
  });
}

export async function handleRequest(body: ApiRequest) {
  const { action, table, id, data, select } = body;

  switch (action) {
    case "list":
      return crud.list(table, select);

    case "get":
      if (!id) throw new Error("Missing id");
      return crud.get(table, id, select);

    case "create":
      if (!data) throw new Error("Missing data");
      if (table === "User") return createUser(data);

      const created = await crud.create(table, data);

      // ★ Result のときだけ型を絞り込む（any 不使用）
      if (table === "Result") {
        const result = created as Result;
        await invalidateAfter(result.playedAt);
      }

      return created;

    case "update":
      if (!id || !data) throw new Error("Missing id or data");
      return crud.update(table, id, data);

    case "delete":
      if (!id) throw new Error("Missing id");

      const deleted = await crud.delete(table, id);

      // ★ Result のときだけ型を絞り込む（any 不使用）
      if (table === "Result") {
        const result = deleted as Result;
        await invalidateAfter(result.playedAt);
      }

      return deleted;

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}