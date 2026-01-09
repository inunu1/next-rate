import { getModel, TableName } from "./model";
import { createUser } from "./user";

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
      return crud.create(table, data);

    case "update":
      if (!id || !data) throw new Error("Missing id or data");
      return crud.update(table, id, data);

    case "delete":
      if (!id) throw new Error("Missing id");
      return crud.delete(table, id);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}