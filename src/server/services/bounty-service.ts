import type { PrismaClient } from "../../generated/prisma/client";
import { appChain, contractAddress } from "../../blockchain/config";
import { publicClient } from "../../blockchain/client";
import { bountyAbi } from "../../contracts/bounty-abi";
import { decodeEventLog, type Hex } from "viem";
import { createBountyRepository } from "../repositories/bounty-repository";
import { toBounty } from "../mappers/bounty-mapper";
import { createChainSyncService } from "./chain-sync-service";
import { ApiError } from "../http/errors";

export function createBountyService(
  db: PrismaClient,
  dependencies: {
    chain?: ReturnType<typeof createChainSyncService>;
    client?: Pick<typeof publicClient, "getTransactionReceipt">;
  } = {},
) {
  const repository = createBountyRepository(db);
  const chain = dependencies.chain ?? createChainSyncService(db);
  const client = dependencies.client ?? publicClient;
  return {
    async list() {
      const snapshot = await chain.sync();
      return (await repository.list(snapshot.deploymentId)).map(toBounty);
    },
    async find(id: number) {
      const existing = await repository.find(id);
      if (!existing?.onchainId) return null;
      if (existing.onchainId) {
        if (
          existing.chainId !== appChain.id ||
          existing.contract !== contractAddress?.toLowerCase()
        )
          return null;
        const snapshot = await chain.sync();
        if (existing.deploymentId !== snapshot.deploymentId) return null;
      }
      const row = await repository.find(id);
      return row?.isCanonical ? toBounty(row) : null;
    },
    async confirm(hash: Hex) {
      const receipt = await client.getTransactionReceipt({ hash });
      if (receipt.status !== "success")
        throw new ApiError("INVALID_TRANSACTION", 400);
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== contractAddress?.toLowerCase())
          continue;
        let decoded;
        try {
          decoded = decodeEventLog({
            abi: bountyAbi,
            data: log.data,
            topics: log.topics,
          });
        } catch {
          continue;
        }
        const snapshot = await chain.sync(true);
        if (snapshot.indexedBlock < receipt.blockNumber)
          throw new ApiError("INDEXING_PENDING", 503);
        const row = await db.bounty.findUnique({
          where: {
            deploymentId_onchainId: {
              deploymentId: snapshot.deploymentId,
              onchainId: String(decoded.args.bountyId),
            },
          },
        });
        if (!row?.isCanonical) throw new ApiError("INVALID_METADATA", 400);
        const indexed = await db.chainTransaction.findUnique({
          where: {
            deploymentId_hash: { deploymentId: snapshot.deploymentId, hash },
          },
        });
        if (
          !indexed?.isCanonical ||
          indexed.bountyId !== row.id ||
          indexed.action !== decoded.eventName ||
          indexed.block !== String(receipt.blockNumber)
        )
          throw new ApiError("INVALID_TRANSACTION", 400);
        return { bountyId: row.id };
      }
      throw new ApiError("INVALID_TRANSACTION", 400);
    },
  };
}
