import { indexTransactions } from "./index-transactions";
import { formatEther, zeroAddress } from "viem";
import type { PrismaClient } from "../../generated/prisma/client";
import { chainReader, type ChainReader } from "../../blockchain/chain-reader";
import { onchainBountyMetadataSchema } from "../../lib/bounty-input";
import { createBountyRepository } from "../repositories/bounty-repository";
import { createUserRepository } from "../repositories/user-repository";
import { ApiError } from "../http/errors";

type Snapshot = { deploymentId: string; indexedBlock: bigint; head: bigint };
export function createChainSyncService(
  db: PrismaClient,
  reader: ChainReader = chainReader,
) {
  const bounties = createBountyRepository(db);
  const users = createUserRepository(db);
  let active: Promise<Snapshot> | undefined;
  let latest: Snapshot | undefined;
  let syncedAt = 0;

  async function resetDeployment(deploymentId: string) {
    latest = undefined;
    syncedAt = 0;
    await db.$transaction([
      db.bounty.updateMany({
        where: { deploymentId },
        data: { isCanonical: false },
      }),
      db.chainDeployment.update({
        where: { id: deploymentId },
        data: { cursor: String(reader.startBlock - 1n), cursorHash: null },
      }),
      db.chainTransaction.updateMany({
        where: { deploymentId },
        data: { isCanonical: false },
      }),
    ]);
  }

  async function synchronize() {
    if (!reader.contract) throw new ApiError("CONTRACT_UNAVAILABLE", 503);
    const head = await reader.head();
    const blockHash = await reader.blockHash(reader.startBlock);
    let deployment = await db.chainDeployment.upsert({
      where: {
        chainId_contract_blockHash: {
          chainId: reader.chainId,
          contract: reader.contract,
          blockHash,
        },
      },
      update: { blockHash },
      create: {
        chainId: reader.chainId,
        contract: reader.contract,
        blockHash,
        startBlock: String(reader.startBlock),
        cursor: String(reader.startBlock - 1n),
      },
    });
    let cursor = BigInt(deployment.cursor);
    const reorg =
      cursor > head ||
      (deployment.cursorHash &&
        cursor >= 0n &&
        (await reader.blockHash(cursor)) !== deployment.cursorHash);
    if (reorg) {
      await resetDeployment(deployment.id);
      cursor = reader.startBlock - 1n;
    }
    for (let batch = 0; cursor < head && batch < 5; batch++) {
      const end = cursor + 2000n < head ? cursor + 2000n : head;
      const endHash = await reader.blockHash(end);
      const ids = await reader.events(cursor + 1n, end);
      for (const id of ids) {
        const row = await reader.bounty(id, end);
        let metadata: unknown;
        try {
          metadata = JSON.parse(row.metadata);
        } catch {
          continue;
        }
        const parsed = onchainBountyMetadataSchema.safeParse(metadata);
        if (!parsed.success) continue;
        const creator = await users.findWallet(row.creator);
        const worker =
          row.worker !== zeroAddress
            ? await users.findWallet(row.worker)
            : null;
        await bounties.upsert(
          deployment.id,
          reader.chainId,
          reader.contract,
          String(id),
          {
            title: parsed.data.title,
            description: parsed.data.description,
            reward: formatEther(row.reward),
            status: ["Open", "In progress", "Completed", "Cancelled"][
              row.status
            ],
            organization: creator?.user.username ?? "",
            initial: creator?.user.username?.slice(0, 1).toUpperCase() ?? "?",
            color: "mint",
            age: "",
            category: parsed.data.category,
            creatorLabel: row.creator,
            creatorAddress: row.creator.toLowerCase(),
            workerAddress:
              row.worker !== zeroAddress ? row.worker.toLowerCase() : null,
            creatorId: creator?.userId ?? null,
            contributorId: worker?.userId ?? null,
            syncedAt: new Date(),
            isCanonical: true,
          },
          parsed.data.tags,
        );
      }
      await indexTransactions(db, reader, deployment.id, cursor + 1n, end);
      if (
        (await reader.blockHash(end)) !== endHash ||
        (cursor >= reader.startBlock
          ? (await reader.blockHash(cursor)) !== deployment.cursorHash
          : (await reader.blockHash(reader.startBlock)) !== blockHash)
      ) {
        await resetDeployment(deployment.id);
        throw new ApiError("INDEXING_PENDING", 503);
      }
      deployment = await db.chainDeployment.update({
        where: { id: deployment.id },
        data: { cursor: String(end), cursorHash: endHash },
      });
      cursor = end;
    }
    syncedAt = Date.now();
    latest = { deploymentId: deployment.id, indexedBlock: cursor, head };
    return latest;
  }

  return {
    async sync(force = false) {
      if (active) return active;
      if (
        !force &&
        latest &&
        latest.indexedBlock === latest.head &&
        Date.now() - syncedAt < 10_000
      )
        return latest;
      active = synchronize().finally(() => {
        active = undefined;
      });
      return active;
    },
  };
}
