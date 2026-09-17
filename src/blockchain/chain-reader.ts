import { decodeEventLog, type Address } from "viem";
import { appChain, contractAddress, deploymentBlock } from "./config";
import { publicClient } from "./client";
import { bountyAbi } from "../contracts/bounty-abi";

export type ChainBounty = {
  creator: Address;
  worker: Address;
  metadata: string;
  reward: bigint;
  status: number;
};
export type ChainReader = {
  chainId: number;
  contract: string;
  startBlock: bigint;
  head: () => Promise<bigint>;
  blockHash: (block: bigint) => Promise<string>;
  blockTimestamp?: (block: bigint) => Promise<bigint>;
  events: (from: bigint, to: bigint) => Promise<bigint[]>;
  bounty: (id: bigint, block: bigint) => Promise<ChainBounty>;
  transactions?: (
    from: bigint,
    to: bigint,
  ) => Promise<
    { bountyId: bigint; hash: string; action: string; block: bigint }[]
  >;
};

export const chainReader: ChainReader = {
  chainId: appChain.id,
  contract: contractAddress?.toLowerCase() ?? "",
  startBlock: deploymentBlock,
  head: () => publicClient.getBlockNumber({ cacheTime: 0 }),
  blockHash: async (blockNumber) =>
    (await publicClient.getBlock({ blockNumber })).hash,
  blockTimestamp: async (blockNumber) =>
    (await publicClient.getBlock({ blockNumber })).timestamp,
  events: async (fromBlock, toBlock) => {
    if (!contractAddress) throw new Error("CONTRACT_UNAVAILABLE");
    const logs = await publicClient.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock,
    });
    return [
      ...new Set(
        logs.flatMap((log) => {
          try {
            return [
              decodeEventLog({
                abi: bountyAbi,
                data: log.data,
                topics: log.topics,
              }).args.bountyId,
            ];
          } catch {
            return [];
          }
        }),
      ),
    ];
  },
  transactions: async (fromBlock, toBlock) => {
    if (!contractAddress) throw new Error("CONTRACT_UNAVAILABLE");
    const logs = await publicClient.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock,
    });
    return logs.flatMap((log) => {
      try {
        const decoded = decodeEventLog({
          abi: bountyAbi,
          data: log.data,
          topics: log.topics,
        });
        return [
          {
            bountyId: decoded.args.bountyId,
            hash: log.transactionHash,
            action: decoded.eventName,
            block: log.blockNumber,
          },
        ];
      } catch {
        return [];
      }
    });
  },
  bounty: (id, blockNumber) => {
    if (!contractAddress) throw new Error("CONTRACT_UNAVAILABLE");
    return publicClient.readContract({
      address: contractAddress,
      abi: bountyAbi,
      functionName: "getBounty",
      args: [id],
      blockNumber,
    });
  },
};
