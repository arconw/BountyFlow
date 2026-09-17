"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { bountyMetadataSchema } from "@/lib/bounty-input";
import { z } from "zod";
import { pendingStorageKey } from "@/blockchain/pending-transaction";
import { useTranslations } from "next-intl";
import { appChain, contractAddress } from "@/blockchain/config";
import { useTransactionExecution } from "@/hooks/use-transaction-execution";
import { LiveTransactionDialog } from "@/components/transactions/transaction-dialog";
import type {
  LiveTransaction,
  TransactionIntent,
} from "@/types/live-transaction";

const pendingSchema = z.object({
  action: z.enum(["create", "accept", "release", "cancel"]),
  reward: z.string(),
  metadata: bountyMetadataSchema.optional(),
  hash: z
    .templateLiteral(["0x", z.string()])
    .refine((value) => /^0x[0-9a-fA-F]{64}$/.test(value)),
  chainId: z.number(),
  contract: z.string(),
  bountyId: z.number().optional(),
  onchainId: z.string().optional(),
});
const TransactionContext = createContext<{
  openTransaction: (intent: TransactionIntent) => void;
  busy: boolean;
} | null>(null);
export function useTransactions() {
  const value = useContext(TransactionContext);
  if (!value) throw new Error("TransactionProvider is required");
  return value;
}
export function TransactionProvider({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [transaction, setTransaction] = useState<LiveTransaction | null>(null);
  const [visible, setVisible] = useState(false);
  const execution = useTransactionExecution(setTransaction);
  const resumed = useRef(false);
  const busy =
    transaction?.state === "awaiting" || transaction?.state === "pending";
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    try {
      const stored = pendingSchema.safeParse(
        JSON.parse(localStorage.getItem(pendingStorageKey) ?? "null"),
      );
      if (
        stored.success &&
        stored.data.chainId === appChain.id &&
        stored.data.contract === contractAddress
      ) {
        const pending = { ...stored.data, state: "pending" as const };
        setVisible(true);
        void execution.wait(pending);
      }
    } catch {}
  }, []);
  return (
    <TransactionContext.Provider
      value={{
        busy: !!busy,
        openTransaction: (intent) => {
          if (!busy) setTransaction({ ...intent, state: "confirm" });
          setVisible(true);
        },
      }}
    >
      {children}
      {transaction && !visible && (busy || transaction.state === "success") && (
        <button className="transaction-toast" onClick={() => setVisible(true)}>
          {t(
            transaction.state === "success"
              ? "transaction_successful"
              : "transaction_pending",
          )}
        </button>
      )}
      {transaction && visible && (
        <LiveTransactionDialog
          transaction={transaction}
          onClose={() => setVisible(false)}
          onConfirm={() => void execution.execute(transaction)}
          onCheck={() => {
            if (transaction.hash)
              void execution.wait({ ...transaction, hash: transaction.hash });
          }}
          onSync={() => void execution.synchronize(transaction)}
        />
      )}
    </TransactionContext.Provider>
  );
}
