import { randomBytes, randomUUID } from "node:crypto";
import { afterEach, beforeEach, expect, it } from "vitest";
import { testDatabase } from "../helpers/database";
import { createDatabase } from "../../src/server/create-database";
import { createAttemptLimiter } from "../../src/server/auth/attempt-limiter";

let database: Awaited<ReturnType<typeof testDatabase>>;
let clients: ReturnType<typeof createDatabase>[];
beforeEach(async () => {
  database = await testDatabase();
  const [{ file }] = await database.db.$queryRaw<
    { file: string }[]
  >`PRAGMA database_list`;
  clients = Array.from({ length: 3 }, () => createDatabase(`file:${file}`));
  await Promise.all(clients.map((client) => client.$connect()));
});
afterEach(async () => {
  await Promise.all(clients.map((client) => client.$disconnect()));
  await database.close();
});

it("enables WAL and bounded busy handling on every independent connection", async () => {
  for (const client of clients) {
    expect(await client.$queryRaw`PRAGMA journal_mode`).toEqual([
      { journal_mode: "wal" },
    ]);
    const result = await client.$queryRaw<
      { timeout: bigint }[]
    >`PRAGMA busy_timeout`;
    expect(Number(result[0].timeout)).toBe(5000);
  }
});

it("allows a second connection to commit while a reader holds a snapshot", async () => {
  await clients[0].$transaction(async (reader) => {
    expect(await reader.user.count()).toBe(0);
    await clients[1].user.create({
      data: { displayName: "Concurrent writer", email: "wal@example.test" },
    });
    expect(await reader.user.count()).toBe(0);
  });
  expect(await clients[0].user.count()).toBe(1);
});

it("shares exact atomic counters while independent connections create accounts", async () => {
  const encryptionKey = randomBytes(48).toString("base64");
  const outcomes = await Promise.all(
    clients.map(async (client, worker) => {
      const limiter = createAttemptLimiter(client, encryptionKey);
      const results: boolean[] = [];
      for (let iteration = 0; iteration < 20; iteration++) {
        results.push(
          (await limiter.consume("shared-sign-in-target", 10, 60)).allowed,
        );
        const user = await client.user.upsert({
          where: { email: `concurrent-${worker}-${iteration}@example.test` },
          update: { email: `concurrent-${worker}-${iteration}@example.test` },
          create: {
            email: `concurrent-${worker}-${iteration}@example.test`,
            displayName: `Worker ${worker}`,
            emailVerified: true,
          },
        });
        await client.authAccount.upsert({
          where: {
            providerId_accountId: {
              providerId: "credential",
              accountId: user.id,
            },
          },
          update: { accountId: user.id },
          create: {
            id: randomUUID(),
            accountId: user.id,
            userId: user.id,
            providerId: "credential",
          },
        });
      }
      return results;
    }),
  );
  expect(outcomes.flat().filter(Boolean)).toHaveLength(10);
  expect((await database.db.authAttempt.findFirstOrThrow()).count).toBe(60);
  expect(await database.db.user.count()).toBe(60);
  expect(await database.db.authAccount.count()).toBe(60);
});
