"use client";
import { useBountyAccess } from "./use-bounty-access";

import { useState, type FormEvent } from "react";
import { parseEther } from "viem";
import {
  bountyMetadataSchema,
  rewardSchema,
  metadataFitsContract,
} from "@/lib/bounty-input";
import { useWallet } from "@/components/providers/wallet-provider";
import { useTransactions } from "@/components/providers/transaction-provider";

export function useCreateBounty() {
  const wallet = useWallet();
  const access = useBountyAccess();
  const transactions = useTransactions();
  const [fields, setFields] = useState({
    title: "",
    description: "",
    skills: [] as string[],
    category: "Development",
    reward: "",
  });
  const [error, setError] = useState<string | null>(null);
  const insufficient =
    wallet.balance !== undefined &&
    rewardSchema.safeParse(fields.reward).success &&
    parseEther(fields.reward) > wallet.balance;
  function update<K extends keyof typeof fields>(
    name: K,
    value: (typeof fields)[K],
  ) {
    setFields((current) => ({ ...current, [name]: value }));
    setError(null);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const metadata = bountyMetadataSchema.safeParse({
      ...fields,
      tags: fields.skills,
    });
    if (!metadata.success) {
      setError(
        metadata.error.issues[0].path[0] === "title"
          ? "invalid_title"
          : metadata.error.issues[0].path[0] === "description"
            ? "invalid_description"
            : "invalid_skills",
      );
      return;
    }
    if (!metadataFitsContract(metadata.data)) {
      setError("metadata_too_large");
      return;
    }
    if (!rewardSchema.safeParse(fields.reward).success) {
      setError("invalid_reward");
      return;
    }
    if (!access.requireAccount()) return;
    if (!wallet.connected) {
      wallet.openWallet();
      return;
    }
    if (!access.requireWallet()) return;
    if (wallet.wrongNetwork) {
      void wallet.switchNetwork();
      return;
    }
    if (!insufficient)
      transactions.openTransaction({
        action: "create",
        reward: fields.reward,
        metadata: metadata.data,
      });
  }
  return {
    authenticated: access.authenticated,
    fields,
    update,
    submit,
    error,
    insufficient,
    wallet,
    busy: transactions.busy,
  };
}
