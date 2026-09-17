"use client";
import { useBountyAccess } from "./use-bounty-access";

import type { Bounty } from "@/types/bounty";
import { useWallet } from "@/components/providers/wallet-provider";
import { useTransactions } from "@/components/providers/transaction-provider";

export function useBountyAction(bounty: Bounty) {
  const wallet = useWallet();
  const access = useBountyAccess();
  const transactions = useTransactions();
  const mine = bounty.onchainId
    ? bounty.creator.toLowerCase() === wallet.address?.toLowerCase()
    : false;
  const canRelease = mine && bounty.status === "In progress";
  const canCancel = mine && bounty.status === "Open";
  const canAccept = !mine && bounty.status === "Open";
  function act(action: "accept" | "release" | "cancel") {
    if (!access.requireAccount() || !bounty.onchainId) return;
    if (!wallet.connected) {
      wallet.openWallet();
      return;
    }
    if (!access.requireWallet()) return;
    if (wallet.wrongNetwork) {
      void wallet.switchNetwork();
      return;
    }
    transactions.openTransaction({
      action,
      reward: bounty.reward,
      bountyId: bounty.id,
      onchainId: bounty.onchainId,
    });
  }
  return {
    authenticated: access.authenticated,
    wallet,
    busy: transactions.busy,
    canRelease,
    canAccept,
    canCancel,
    act,
  };
}
