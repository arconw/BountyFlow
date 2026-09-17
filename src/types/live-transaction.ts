import type { Hex } from "viem";
import type { BountyMetadata } from "@/lib/bounty-input";

export type LiveAction = "create" | "accept" | "release" | "cancel";
export type TransactionIntent = {
  action: LiveAction;
  reward: string;
  bountyId?: number;
  onchainId?: string;
  metadata?: BountyMetadata;
};
export type LiveTransaction = TransactionIntent & {
  state: "confirm" | "awaiting" | "pending" | "success" | "failed" | "rejected";
  hash?: Hex;
  error?: string;
  syncError?: boolean;
};
