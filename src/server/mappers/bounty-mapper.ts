import { bountySchema } from "../../lib/bounty-schema";
import type { BountyRecord } from "../repositories/bounty-repository";

export function toBounty(row: BountyRecord) {
  const organization = row.onchainId
    ? (row.creator?.username ?? "")
    : row.organization;
  const creator = row.creatorAddress ?? row.creatorLabel;
  return bountySchema.parse({
    ...row,
    tags: row.skills.map((skill) => skill.name),
    creator,
    organization,
    contributorName: row.contributor?.username ?? "",
    creatorUserId: row.creatorId,
    contributorUserId: row.contributorId,
    initial: row.onchainId
      ? organization.slice(0, 1).toUpperCase() || "?"
      : row.initial,
    color: row.onchainId ? "mint" : row.color,
    onchainId: row.onchainId,
    chainId: row.chainId,
    worker: row.workerAddress,
    transactionHash: row.transactions[0]?.hash ?? null,
    createdAt: row.createdAt.toISOString(),
  });
}
