import { resolve } from "node:path";

export function databaseUrl() {
  return process.env.DATABASE_URL ?? `file:${resolve("data/bountyflow.db")}`;
}
