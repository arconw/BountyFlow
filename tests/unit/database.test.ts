import { afterEach, beforeEach, expect, it } from "vitest";
import { testDatabase } from "../helpers/database";
import { seedDemoData } from "../../prisma/seed-data";
import { createChainSyncService } from "../../src/server/services/chain-sync-service";
import { bounties } from "../../prisma/fixtures/bounties";
import { createProfileService } from "../../src/server/services/profile-service";

let database: Awaited<ReturnType<typeof testDatabase>>;
beforeEach(async () => {
  database = await testDatabase();
});
afterEach(async () => {
  await database.close();
});
const addresses = [
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
] as const;
it("seeds related users, accounts and indexed tasks idempotently without UI fixtures", async () => {
  await seedDemoData(database.db, addresses);
  const samples = [bounties[0], bounties[2], bounties[5]];
  const chain = createChainSyncService(database.db, {
    chainId: 31337,
    contract: "0x3333333333333333333333333333333333333333",
    startBlock: 1n,
    head: async () => 3n,
    blockHash: async (block) => `block-${block}`,
    events: async () => [1n, 2n, 3n],
    bounty: async (id) => ({
      creator: addresses[0],
      worker:
        id === 1n ? "0x0000000000000000000000000000000000000000" : addresses[1],
      metadata: JSON.stringify(samples[Number(id) - 1]),
      reward: 10000000000000000n,
      status: Number(id) - 1,
    }),
    transactions: async () =>
      [1n, 2n, 3n].map((id) => ({
        bountyId: id,
        hash: `hash-${id}`,
        action: "BountyCreated",
        block: id,
      })),
  });
  await chain.sync(true);
  await seedDemoData(database.db, addresses);
  await chain.sync(true);
  expect(await database.db.user.count()).toBe(2);
  expect(await database.db.authAccount.count()).toBe(2);
  expect(await database.db.wallet.count()).toBe(2);
  expect(await database.db.bounty.count()).toBe(3);
  expect(await database.db.chainTransaction.count()).toBe(3);
  const task = await database.db.bounty.findFirstOrThrow({
    where: { status: "Completed" },
    include: { creator: true, contributor: true, skills: true },
  });
  expect(task.creator?.username).toBe("nora_builds");
  expect(task.contributor?.username).toBe("leo_codes");
  expect(task.skills.length).toBeGreaterThan(0);
});
it("does not replace an existing registered wallet owner when seeding", async () => {
  const user = await database.db.user.create({
    data: {
      displayName: "Owner",
      email: "owner@example.test",
      wallets: { create: { address: addresses[0], chainId: 31337 } },
    },
  });
  await seedDemoData(database.db, addresses);
  expect(
    (
      await database.db.wallet.findUniqueOrThrow({
        where: { address: addresses[0] },
      })
    ).userId,
  ).toBe(user.id);
});
it("enforces wallet uniqueness and cascading user relations", async () => {
  const wallet = await database.db.wallet.create({
    data: {
      address: "0x1111111111111111111111111111111111111111",
      chainId: 31337,
      user: { create: { displayName: "Alice" } },
    },
  });
  await expect(
    database.db.wallet.create({
      data: { address: wallet.address, chainId: 31337, userId: wallet.userId },
    }),
  ).rejects.toMatchObject({ code: "P2002" });
  await database.db.user.delete({ where: { id: wallet.userId } });
  expect(await database.db.wallet.count()).toBe(0);
});
it("replaces profile skill relations without duplicate records", async () => {
  const user = await database.db.user.create({
    data: { displayName: "Alice" },
  });
  const service = createProfileService(database.db);
  await service.update(user.id, {
    name: "Alice",
    bio: "Builder",
    website: "",
    skills: ["React", "react", " TypeScript "],
  });
  expect(
    (
      await database.db.user.findUnique({
        where: { id: user.id },
        include: { skills: true },
      })
    )?.skills,
  ).toHaveLength(2);
  await service.update(user.id, {
    name: "Alice",
    bio: "",
    website: "",
    skills: ["Solidity"],
  });
  expect((await service.get(user.id))?.skills).toEqual(["Solidity"]);
});
