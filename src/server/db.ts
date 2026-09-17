import "server-only";
import { createDatabase } from "./create-database";
import { databaseUrl } from "./database-url";

const globalDatabase = globalThis as unknown as {
  database?: ReturnType<typeof createDatabase>;
};
export const db = globalDatabase.database ?? createDatabase(databaseUrl());
if (process.env.NODE_ENV !== "production") globalDatabase.database = db;
