import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { zeroAddress } from "viem";
import { testDatabase } from "../helpers/database";
import { createChainSyncService } from "../../src/server/services/chain-sync-service";
import { createBountyRepository } from "../../src/server/repositories/bounty-repository";
import type { ChainReader } from "../../src/blockchain/chain-reader";

let database: Awaited<ReturnType<typeof testDatabase>>;
beforeEach(async () => {
  database = await testDatabase();
});
afterEach(async () => {
  await database.close();
});
function fakeReader() {
  let generation = "a";
  let head = 2n;
  let ids = [1n, 2n];
  const reader: ChainReader = {
    chainId: 31337,
    contract: "0x2222222222222222222222222222222222222222",
    startBlock: 1n,
    head: async () => head,
    blockHash: async (block) => `${generation}:${block}`,
    events: vi.fn(async () => ids),
    bounty: vi.fn(async (id) => ({
      creator: "0x1111111111111111111111111111111111111111" as const,
      worker: zeroAddress,
      reward: 1n,
      status: 0,
      metadata: JSON.stringify({
        title: `A valid bounty number ${id}`,
        description: "A meaningful task for the indexing test.",
        tags: ["React"],
        category: "Development",
      }),
    })),
  };
  return {
    reader,
    reset: () => {
      generation = "b";
      head = 1n;
      ids = [1n];
    },
    advance: () => {
      head++;
      ids = [];
    },
    large: () => {
      ids = [2001n];
    },
  };
}
it("indexes bounty ids beyond 2000 without a catalog-wide capacity failure", async () => {
  const fixture = fakeReader();
  fixture.large();
  const snapshot = await createChainSyncService(
    database.db,
    fixture.reader,
  ).sync(true);
  const records = await createBountyRepository(database.db).list(
    snapshot.deploymentId,
  );
  expect(records.map((record) => record.onchainId)).toEqual(["2001"]);
});
it("does not reread unchanged bounties when the chain advances", async () => {
  const fixture = fakeReader();
  const service = createChainSyncService(database.db, fixture.reader);
  await service.sync(true);
  expect(fixture.reader.bounty).toHaveBeenCalledTimes(2);
  fixture.advance();
  await service.sync(true);
  expect(fixture.reader.bounty).toHaveBeenCalledTimes(2);
});
it("keeps historical records out of the catalog after a chain restart", async () => {
  const fixture = fakeReader();
  const service = createChainSyncService(database.db, fixture.reader);
  const first = await service.sync(true);
  fixture.reset();
  const second = await service.sync(true);
  expect(second.deploymentId).not.toBe(first.deploymentId);
  expect(
    await createBountyRepository(database.db).list(second.deploymentId),
  ).toHaveLength(1);
  expect(
    await createBountyRepository(database.db).list(first.deploymentId),
  ).toHaveLength(2);
  expect(await database.db.bounty.count()).toBe(3);
});
it("persists a block cursor and continues in bounded batches", async () => {
  const fixture = fakeReader();
  fixture.reader.head = async () => 50_000n;
  fixture.reader.events = vi.fn(async () => []);
  const first = await createChainSyncService(database.db, fixture.reader).sync(
    true,
  );
  expect(first.indexedBlock).toBe(10_000n);
  const second = await createChainSyncService(database.db, fixture.reader).sync(
    true,
  );
  expect(second.indexedBlock).toBe(20_000n);
});

it("coalesces concurrent forced synchronizations", async () => {
  const fixture = fakeReader();
  const service = createChainSyncService(database.db, fixture.reader);
  const results = await Promise.all([
    service.sync(true),
    service.sync(true),
    service.sync(true),
  ]);
  expect(new Set(results.map((result) => result.deploymentId)).size).toBe(1);
  expect(fixture.reader.events).toHaveBeenCalledTimes(1);
});

it("rolls back orphaned bounties, worker assignments and receipts after a fork", async () => {
  const fixture = fakeReader();
  let forked = false;
  fixture.reader.head = async () => 3n;
  fixture.reader.blockHash = async (block) =>
    block === 1n ? "deployment" : `${forked ? "new" : "old"}:${block}`;
  fixture.reader.events = async () => (forked ? [1n] : [1n, 2n]);
  const readBounty = fixture.reader.bounty;
  fixture.reader.bounty = async (id, block) => ({
    ...(await readBounty(id, block)),
    status: !forked && id === 1n ? 1 : 0,
    worker:
      !forked && id === 1n
        ? "0x3333333333333333333333333333333333333333"
        : zeroAddress,
  });
  const created = {
    bountyId: 1n,
    hash: "canonical-creation",
    action: "BountyCreated",
    block: 1n,
  };
  fixture.reader.transactions = async () =>
    forked
      ? [created]
      : [
          created,
          {
            bountyId: 1n,
            hash: "orphaned-acceptance",
            action: "BountyAccepted",
            block: 2n,
          },
          {
            bountyId: 2n,
            hash: "orphaned-creation",
            action: "BountyCreated",
            block: 3n,
          },
        ];
  const service = createChainSyncService(database.db, fixture.reader);
  const before = await service.sync(true);
  forked = true;
  const after = await service.sync(true);
  expect(after.deploymentId).toBe(before.deploymentId);
  const records = await createBountyRepository(database.db).list(
    after.deploymentId,
  );
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    onchainId: "1",
    status: "Open",
    workerAddress: null,
    contributorId: null,
  });
  expect(
    records[0].transactions.map((transaction) => transaction.hash),
  ).toEqual(["canonical-creation"]);
  expect(
    await database.db.chainTransaction.count({ where: { isCanonical: false } }),
  ).toBe(2);
  expect(await database.db.bounty.count()).toBe(2);
});

it("does not commit a cursor when the chain forks while reading a batch", async () => {
  const fixture = fakeReader();
  let forked = false;
  fixture.reader.blockHash = async (block) =>
    block === 1n ? "deployment" : `${forked ? "new" : "old"}:${block}`;
  const readBounty = fixture.reader.bounty;
  fixture.reader.bounty = async (id, block) => {
    const bounty = await readBounty(id, block);
    const status = forked ? 0 : 1;
    forked = true;
    return { ...bounty, status };
  };
  const service = createChainSyncService(database.db, fixture.reader);
  await expect(service.sync(true)).rejects.toMatchObject({
    code: "INDEXING_PENDING",
  });
  expect(await database.db.bounty.count({ where: { isCanonical: true } })).toBe(
    0,
  );
  expect((await database.db.chainDeployment.findFirstOrThrow()).cursor).toBe(
    "0",
  );
  const recovered = await service.sync();
  expect(recovered.indexedBlock).toBe(2n);
  expect(
    (
      await createBountyRepository(database.db).list(recovered.deploymentId)
    ).map((bounty) => bounty.status),
  ).toEqual(["Open", "Open"]);
});

it("uses the creation block timestamp and preserves it after later actions", async () => {
  const fixture = fakeReader();
  const timestamp = 1_700_000_000n;
  fixture.reader.blockTimestamp = vi.fn(async (block) => timestamp + block);
  fixture.reader.transactions = async () => [
    {
      bountyId: 1n,
      hash: "created-first",
      action: "BountyCreated",
      block: 1n,
    },
    {
      bountyId: 2n,
      hash: "created-second",
      action: "BountyCreated",
      block: 1n,
    },
    {
      bountyId: 1n,
      hash: "accepted-first",
      action: "BountyAccepted",
      block: 2n,
    },
  ];
  const service = createChainSyncService(database.db, fixture.reader);
  const snapshot = await service.sync(true);
  const records = await createBountyRepository(database.db).list(
    snapshot.deploymentId,
  );
  expect(records.map((record) => record.createdAt)).toEqual([
    new Date(Number(timestamp + 1n) * 1000),
    new Date(Number(timestamp + 1n) * 1000),
  ]);
  expect(fixture.reader.blockTimestamp).toHaveBeenCalledTimes(1);
  expect(fixture.reader.blockTimestamp).toHaveBeenCalledWith(1n);
  fixture.advance();
  fixture.reader.transactions = async () => [
    {
      bountyId: 1n,
      hash: "completed-first",
      action: "BountyCompleted",
      block: 3n,
    },
  ];
  await service.sync(true);
  expect(
    (await createBountyRepository(database.db).list(snapshot.deploymentId)).map(
      (record) => record.createdAt,
    ),
  ).toEqual(records.map((record) => record.createdAt));
  expect(fixture.reader.blockTimestamp).toHaveBeenCalledTimes(1);
});

it("keeps indexing immutable legacy tags through acceptance, payout and a reorganization", async () => {
  const fixture = fakeReader();
  let head = 2n;
  let status = 0;
  let generation = "original";
  fixture.reader.head = async () => head;
  fixture.reader.blockHash = async (block) =>
    block === 1n ? "deployment" : `${generation}:${block}`;
  fixture.reader.events = async () => [1n];
  const readBounty = fixture.reader.bounty;
  fixture.reader.bounty = async (id, block) => {
    const bounty = await readBounty(id, block);
    return {
      ...bounty,
      status,
      worker:
        status === 0
          ? zeroAddress
          : ("0x3333333333333333333333333333333333333333" as const),
      metadata: JSON.stringify({
        ...JSON.parse(bounty.metadata),
        tags: ["Ethers.js", "Legacy SDK"],
      }),
    };
  };
  const service = createChainSyncService(database.db, fixture.reader);
  for (const expected of ["Open", "In progress", "Completed"] as const) {
    const snapshot = await service.sync(true);
    const [bounty] = await createBountyRepository(database.db).list(
      snapshot.deploymentId,
    );
    expect(bounty.status).toBe(expected);
    expect(bounty.skills.map((skill) => skill.name)).toEqual([
      "Ethers.js",
      "Legacy SDK",
    ]);
    status++;
    head++;
  }
  generation = "replacement";
  status = 1;
  const rebuilt = await service.sync(true);
  const bounties = await createBountyRepository(database.db).list(
    rebuilt.deploymentId,
  );
  expect(bounties).toHaveLength(1);
  expect(bounties[0].status).toBe("In progress");
  expect(bounties[0].skills.map((skill) => skill.name)).toContain("Ethers.js");
});
