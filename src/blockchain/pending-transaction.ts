import { appChain, contractAddress } from "./config";
import type { LiveTransaction } from "../types/live-transaction";

export const pendingStorageKey = "bountyboard_pending_transaction";
export function persistPendingTransaction(transaction: LiveTransaction) {
  try {
    localStorage.setItem(
      pendingStorageKey,
      JSON.stringify({
        ...transaction,
        chainId: appChain.id,
        contract: contractAddress,
      }),
    );
  } catch {}
}
export function clearPendingTransaction() {
  try {
    localStorage.removeItem(pendingStorageKey);
  } catch {}
}
