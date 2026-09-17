import type { Hex } from "viem";

type ComparableTransaction = {
  to: string | null;
  input: Hex;
  value: bigint;
  hash: Hex;
};
export function replacementPreservesIntent(replacement: {
  reason: "cancelled" | "replaced" | "repriced";
  transaction: ComparableTransaction;
  replacedTransaction: ComparableTransaction;
}) {
  return (
    replacement.reason !== "cancelled" &&
    replacement.transaction.to?.toLowerCase() ===
      replacement.replacedTransaction.to?.toLowerCase() &&
    replacement.transaction.input === replacement.replacedTransaction.input &&
    replacement.transaction.value === replacement.replacedTransaction.value
  );
}
