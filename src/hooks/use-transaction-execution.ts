"use client";

import { useRef } from "react";
import { useConfig, useWriteContract } from "wagmi";
import { getConnection } from "wagmi/actions";
import { parseEther, type Hex } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { publicClient } from "@/blockchain/client";
import { appChain, contractAddress } from "@/blockchain/config";
import { bountyAbi } from "@/contracts/bounty-abi";
import { blockchainErrorKey } from "@/blockchain/errors";
import {
  authorizeTransaction,
  confirmTransaction,
} from "@/server/actions/transactions";
import type {
  LiveTransaction,
  TransactionIntent,
} from "@/types/live-transaction";

import { replacementPreservesIntent } from "@/blockchain/transaction-replacement";
import {
  persistPendingTransaction,
  clearPendingTransaction,
} from "@/blockchain/pending-transaction";
export function useTransactionExecution(
  update: (transaction: LiveTransaction) => void,
) {
  const write = useWriteContract();
  const config = useConfig();
  const queries = useQueryClient();
  const router = useRouter();
  const lock = useRef(false);

  async function synchronize(transaction: LiveTransaction) {
    try {
      const result = await confirmTransaction(transaction.hash);
      if (result.error || !result.data) {
        if (
          result.error === "INVALID_TRANSACTION" ||
          result.error === "INVALID_METADATA" ||
          result.error === "INVALID_INPUT"
        ) {
          update({
            ...transaction,
            state: "failed",
            error: "transaction_replaced",
          });
          return;
        }
        update({ ...transaction, state: "success", syncError: true });
        return;
      }
      update({
        ...transaction,
        state: "success",
        bountyId: result.data.bountyId,
        syncError: false,
      });
      await queries.invalidateQueries({ queryKey: ["balance"] });
      router.refresh();
    } catch (error) {
      update({ ...transaction, state: "success", syncError: true });
    }
  }

  async function wait(transaction: LiveTransaction & { hash: Hex }) {
    update({ ...transaction, state: "pending", error: undefined });
    let superseded = false;
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transaction.hash,
        timeout: 120_000,
        onReplaced: (replacement) => {
          superseded = superseded || !replacementPreservesIntent(replacement);
          transaction = { ...transaction, hash: replacement.transaction.hash };
          if (superseded) {
            clearPendingTransaction();
            update({
              ...transaction,
              state: "rejected",
              error: "transaction_replaced",
            });
          } else {
            persistPendingTransaction(transaction);
            update({ ...transaction, state: "pending" });
          }
        },
      });
      clearPendingTransaction();
      if (superseded) return;
      if (receipt.status !== "success") {
        update({ ...transaction, state: "failed", error: "contract_failed" });
        return;
      }
      await synchronize(transaction);
    } catch {
      if (superseded) return;
      update({
        ...transaction,
        state: "pending",
        error: "receipt_unavailable",
      });
    }
  }

  async function execute(intent: TransactionIntent) {
    if (lock.current) return;
    lock.current = true;
    try {
      const connection = getConnection(config);
      if (
        !connection.address ||
        connection.chainId !== appChain.id ||
        !contractAddress
      ) {
        update({
          ...intent,
          state: "failed",
          error: "wallet_network_required",
        });
        return;
      }
      const authorization = await authorizeTransaction(connection.address);
      if (authorization.error || !authorization.data) {
        update({ ...intent, state: "failed", error: "auth_wallet_gate" });
        return;
      }
      update({ ...intent, state: "awaiting" });
      const common = {
        address: contractAddress,
        abi: bountyAbi,
        account: connection.address,
        chain: appChain,
      };
      const simulation =
        intent.action === "create"
          ? await publicClient.simulateContract({
              ...common,
              functionName: "createBounty",
              args: [JSON.stringify(intent.metadata)],
              value: parseEther(intent.reward),
            })
          : await publicClient.simulateContract({
              ...common,
              functionName:
                intent.action === "accept"
                  ? "acceptBounty"
                  : intent.action === "release"
                    ? "completeBounty"
                    : "cancelBounty",
              args: [BigInt(intent.onchainId!)],
            });
      const current = getConnection(config);
      if (
        current.address !== connection.address ||
        current.chainId !== appChain.id
      ) {
        update({
          ...intent,
          state: "failed",
          error: "wallet_network_required",
        });
        return;
      }
      const hash =
        simulation.request.functionName === "createBounty"
          ? await write.mutateAsync({
              address: contractAddress,
              abi: bountyAbi,
              functionName: "createBounty",
              args: [JSON.stringify(intent.metadata)],
              value: parseEther(intent.reward),
              account: connection.address,
              chainId: appChain.id,
            })
          : await write.mutateAsync({
              address: contractAddress,
              abi: bountyAbi,
              functionName:
                intent.action === "accept"
                  ? "acceptBounty"
                  : intent.action === "release"
                    ? "completeBounty"
                    : "cancelBounty",
              args: [BigInt(intent.onchainId!)],
              account: connection.address,
              chainId: appChain.id,
            });
      const transaction: LiveTransaction & { hash: Hex } = {
        ...intent,
        state: "pending",
        hash,
      };
      persistPendingTransaction(transaction);
      await wait(transaction);
    } catch (error) {
      const key = blockchainErrorKey(error);
      update({
        ...intent,
        state: key === "wallet_rejected" ? "rejected" : "failed",
        error: key,
      });
    } finally {
      lock.current = false;
    }
  }
  return { execute, wait, synchronize };
}
