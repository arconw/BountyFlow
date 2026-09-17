import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from "viem";

export function blockchainErrorKey(error: unknown) {
  if (error instanceof Error && error.message === "WALLET_ALREADY_LINKED")
    return "wallet_already_linked";
  if (error instanceof Error && error.message === "AUTH_REQUIRED")
    return "auth_wallet_gate";
  if (error instanceof BaseError) {
    if (
      error.walk(
        (cause) => cause instanceof UserRejectedRequestError,
      ) instanceof UserRejectedRequestError
    )
      return "wallet_rejected";
    if (
      error.walk((cause) => cause instanceof InsufficientFundsError) instanceof
      InsufficientFundsError
    )
      return "transaction_insufficient_funds";
    const reverted = error.walk(
      (cause) => cause instanceof ContractFunctionRevertedError,
    );
    if (reverted instanceof ContractFunctionRevertedError) {
      if (reverted.data?.errorName === "OnlyCreator")
        return "only_the_bounty_creator_can_release_the_reward";
      return "contract_failed";
    }
  }
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    error.code === 4001
  )
    return "wallet_rejected";
  return "rpc_unavailable";
}
