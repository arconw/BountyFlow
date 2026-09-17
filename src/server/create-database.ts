import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

class ApplicationSqliteAdapter extends PrismaBetterSqlite3 {
  async connect() {
    const connection = await super.connect();
    try {
      await connection.executeScript(
        "PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
      );
      return connection;
    } catch (error) {
      await connection.dispose();
      throw error;
    }
  }
}

export function createDatabase(url: string) {
  return new PrismaClient({
    adapter: new ApplicationSqliteAdapter({ url, timeout: 5000 }),
  });
}
