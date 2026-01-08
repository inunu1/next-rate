import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { authOptions } from "@/lib/auth";

type TableName = Prisma.ModelName;

type SelectFields = Record<string, boolean> | undefined;
type DataFields = Record<string, unknown>;

type ApiRequest = {
  action: "list" | "get" | "create" | "update" | "delete";
  table: TableName;
  id?: string;
  data?: DataFields;
  select?: SelectFields;
};

type ModelDelegate = {
  findMany: (args?: unknown) => Promise<unknown>;
  findUnique: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

const getModel = (table: TableName): ModelDelegate => {
  const key = table.charAt(0).toLowerCase() + table.slice(1);
  const model = prisma[key as keyof typeof prisma];
  return model as unknown as ModelDelegate;
};

const crud = {
  async list(table: TableName, select?: SelectFields) {
    const model = getModel(table);
    return model.findMany({ select });
  },

  async get(table: TableName, id: string, select?: SelectFields) {
    const model = getModel(table);
    return model.findUnique({ where: { id }, select });
  },

  async create(table: TableName, data: DataFields) {
    const model = getModel(table);
    return model.create({ data });
  },

  async update(table: TableName, id: string, data: DataFields) {
    const model = getModel(table);
    return model.update({
      where: { id },
      data,
    });
  },

  async delete(table: TableName, id: string) {
    const model = getModel(table);
    return model.delete({
      where: { id },
    });
  },
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as ApiRequest;
    const { action, table, id, data, select } = body;

    switch (action) {
      case "list":
        return NextResponse.json(await crud.list(table, select));

      case "get":
        if (!id) throw new Error("Missing id");
        return NextResponse.json(await crud.get(table, id, select));

      case "create":
        if (!data) throw new Error("Missing data");

        if (table === "User") {
          const hashed = await bcrypt.hash(data.password as string, 10);
          const userData = {
            name: data.name,
            email: data.email,
            hashedPassword: hashed,
          };
          return NextResponse.json(await crud.create(table, userData));
        }

        return NextResponse.json(await crud.create(table, data));

      case "update":
        if (!id || !data) throw new Error("Missing id or data");
        return NextResponse.json(await crud.update(table, id, data));

      case "delete":
        if (!id) throw new Error("Missing id");
        return NextResponse.json(await crud.delete(table, id));

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}