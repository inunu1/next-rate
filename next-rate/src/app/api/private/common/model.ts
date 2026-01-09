import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type TableName = Prisma.ModelName;

export type ModelDelegate = {
  findMany: (args?: unknown) => Promise<unknown>;
  findUnique: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

export const getModel = (table: TableName): ModelDelegate => {
  const key = table.charAt(0).toLowerCase() + table.slice(1);
  const model = prisma[key as keyof typeof prisma];
  return model as unknown as ModelDelegate;
};