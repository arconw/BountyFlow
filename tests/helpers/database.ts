import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createDatabase } from "../../src/server/create-database";

export async function testDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "bountyflow-test-"));
  const path = join(directory, "test.db");
  const sqlite = new DatabaseSync(path);
  for (const migration of (await readdir("prisma/migrations"))
    .filter((name) => /^\d/.test(name))
    .sort())
    sqlite.exec(
      await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"),
    );
  sqlite.close();
  const db = createDatabase(`file:${path}`);
  return {
    db,
    close: async () => {
      await db.$disconnect();
      await rm(directory, { recursive: true });
    },
  };
}
