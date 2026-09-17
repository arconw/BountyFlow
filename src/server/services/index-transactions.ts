import type { PrismaClient } from "../../generated/prisma/client";
import type { ChainReader } from "../../blockchain/chain-reader";
export async function indexTransactions(
  db: PrismaClient,
  reader: ChainReader,
  deploymentId: string,
  from: bigint,
  to: bigint,
) {
  if (!reader.transactions) return;
  const timestamps = new Map<bigint, Date>();
  for (const event of await reader.transactions(from, to)) {
    const bounty = await db.bounty.findUnique({
      where: {
        deploymentId_onchainId: {
          deploymentId,
          onchainId: String(event.bountyId),
        },
      },
      select: { id: true, isCanonical: true },
    });
    if (!bounty?.isCanonical) continue;
    if (event.action === "BountyCreated" && reader.blockTimestamp) {
      let createdAt = timestamps.get(event.block);
      if (!createdAt) {
        createdAt = new Date(
          Number(await reader.blockTimestamp(event.block)) * 1000,
        );
        timestamps.set(event.block, createdAt);
      }
      await db.bounty.update({ where: { id: bounty.id }, data: { createdAt } });
    }
    const data = {
      chainId: reader.chainId,
      action: event.action,
      block: String(event.block),
      bountyId: bounty.id,
      isCanonical: true,
    };
    await db.chainTransaction.upsert({
      where: { deploymentId_hash: { deploymentId, hash: event.hash } },
      create: { deploymentId, hash: event.hash, ...data },
      update: data,
    });
  }
}
