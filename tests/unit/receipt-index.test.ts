import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  encodeAbiParameters,
  encodeEventTopics,
  type TransactionReceipt,
} from "viem";
import { testDatabase } from "../helpers/database";
import { createBountyService } from "../../src/server/services/bounty-service";
import { bountyAbi } from "../../src/contracts/bounty-abi";
import { contractAddress } from "../../src/blockchain/config";

let database: Awaited<ReturnType<typeof testDatabase>>;
beforeEach(async () => {
  database = await testDatabase();
});
afterEach(async () => {
  await database.close();
});
it("treats a confirmed transaction ahead of the cursor as pending indexing", async () => {
  const receipt = {
    status: "success",
    to: contractAddress,
    blockNumber: 20_001n,
    logs: [
      {
        address: contractAddress,
        topics: encodeEventTopics({
          abi: bountyAbi,
          eventName: "BountyCreated",
          args: {
            bountyId: 1n,
            creator: "0x1111111111111111111111111111111111111111",
          },
        }),
        data: encodeAbiParameters([{ type: "uint256" }], [1n]),
      },
    ],
  } as unknown as TransactionReceipt;
  const service = createBountyService(database.db, {
    chain: {
      sync: vi.fn().mockResolvedValue({
        deploymentId: "test",
        indexedBlock: 10_000n,
        head: 20_001n,
      }),
    },
    client: { getTransactionReceipt: vi.fn().mockResolvedValue(receipt) },
  });
  await expect(service.confirm(`0x${"1".repeat(64)}`)).rejects.toMatchObject({
    code: "INDEXING_PENDING",
    status: 503,
  });
  expect(await database.db.chainTransaction.count()).toBe(0);
});

it("does not restore an orphaned transaction from a stale receipt after a reorganization", async () => {
  const hash = `0x${"2".repeat(64)}` as const;
  const deployment = await database.db.chainDeployment.create({
    data: {
      chainId: 31337,
      contract: contractAddress!,
      blockHash: "deployment-block",
      startBlock: "1",
      cursor: "3",
      cursorHash: "canonical-head",
    },
  });
  const bounty = await database.db.bounty.create({
    data: {
      deploymentId: deployment.id,
      onchainId: "1",
      title: "A canonical bounty after a chain reorganization",
      description: "The old acceptance has been removed from the chain.",
      reward: "0.01",
      status: "Open",
      organization: "builder",
      initial: "B",
      color: "mint",
      age: "",
      category: "Development",
      creatorLabel: "builder",
    },
  });
  await database.db.chainTransaction.create({
    data: {
      deploymentId: deployment.id,
      chainId: 31337,
      bountyId: bounty.id,
      hash,
      action: "BountyAccepted",
      block: "2",
      isCanonical: false,
    },
  });
  const receipt = {
    status: "success",
    to: contractAddress,
    blockNumber: 2n,
    logs: [
      {
        address: contractAddress,
        topics: encodeEventTopics({
          abi: bountyAbi,
          eventName: "BountyAccepted",
          args: {
            bountyId: 1n,
            worker: "0x1111111111111111111111111111111111111111",
          },
        }),
        data: "0x",
      },
    ],
  } as unknown as TransactionReceipt;
  const service = createBountyService(database.db, {
    chain: {
      sync: vi.fn().mockResolvedValue({
        deploymentId: deployment.id,
        indexedBlock: 3n,
        head: 3n,
      }),
    },
    client: { getTransactionReceipt: vi.fn().mockResolvedValue(receipt) },
  });
  await expect(service.confirm(hash)).rejects.toMatchObject({
    code: "INVALID_TRANSACTION",
  });
  const transaction = await database.db.chainTransaction.findUniqueOrThrow({
    where: { deploymentId_hash: { deploymentId: deployment.id, hash } },
  });
  expect(transaction.isCanonical).toBe(false);
  await database.db.chainTransaction.update({
    where: { id: transaction.id },
    data: { isCanonical: true },
  });
  await expect(service.confirm(hash)).resolves.toEqual({ bountyId: bounty.id });
  receipt.to = "0x3333333333333333333333333333333333333333";
  await expect(service.confirm(hash)).resolves.toEqual({ bountyId: bounty.id });
});
