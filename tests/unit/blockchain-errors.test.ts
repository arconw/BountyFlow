import { expect, it } from "vitest";
import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
  encodeErrorResult,
} from "viem";
import { blockchainErrorKey } from "../../src/blockchain/errors";
import { bountyAbi } from "../../src/contracts/bounty-abi";

it("identifies insufficient funds inside wallet and contract error wrappers", () => {
  const error = new BaseError("Transaction failed", {
    cause: new BaseError("Wallet request failed", {
      cause: new InsufficientFundsError(),
    }),
  });
  expect(blockchainErrorKey(error)).toBe("transaction_insufficient_funds");
});

it("keeps wallet rejection distinct from RPC and contract failures", () => {
  expect(
    blockchainErrorKey(
      new BaseError("Wallet request failed", {
        cause: new UserRejectedRequestError(new Error("Rejected")),
      }),
    ),
  ).toBe("wallet_rejected");
  expect(blockchainErrorKey({ code: 4001 })).toBe("wallet_rejected");
  expect(blockchainErrorKey(new Error("Network timeout"))).toBe(
    "rpc_unavailable",
  );
});

it("explains creator-only payout permission without exposing raw RPC details", () => {
  const error = new ContractFunctionRevertedError({
    abi: bountyAbi,
    functionName: "completeBounty",
    data: encodeErrorResult({ abi: bountyAbi, errorName: "OnlyCreator" }),
  });
  expect(
    blockchainErrorKey(new BaseError("Request failed", { cause: error })),
  ).toBe("only_the_bounty_creator_can_release_the_reward");
});
