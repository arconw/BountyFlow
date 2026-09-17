import { expect, it } from "vitest";
import {
  metadataFitsContract,
  bountyMetadataSchema,
} from "../../src/lib/bounty-input";
import { replacementPreservesIntent } from "../../src/blockchain/transaction-replacement";
import {
  persistPendingTransaction,
  pendingStorageKey,
} from "../../src/blockchain/pending-transaction";

it("validates serialized UTF-8 size for Cyrillic and CJK metadata", () => {
  for (const text of ["я".repeat(6000), "界".repeat(5000)]) {
    const metadata = {
      title: "A valid task title",
      description: text,
      tags: [],
      category: "Development",
    };
    expect(bountyMetadataSchema.safeParse(metadata).success).toBe(true);
    expect(metadataFitsContract(metadata)).toBe(false);
  }
  expect(
    metadataFitsContract({
      title: "A valid task title",
      description: "A short valid description",
      tags: [],
      category: "Development",
    }),
  ).toBe(true);
});
it("distinguishes cancellation and changed intent from gas repricing", () => {
  const original = {
    to: "0x1111111111111111111111111111111111111111",
    input: "0x1234" as const,
    value: 10n,
    hash: "0x1111" as const,
  };
  const replacement = { ...original, hash: "0x2222" as const };
  expect(
    replacementPreservesIntent({
      reason: "repriced",
      replacedTransaction: original,
      transaction: replacement,
    }),
  ).toBe(true);
  expect(
    replacementPreservesIntent({
      reason: "cancelled",
      replacedTransaction: original,
      transaction: { ...replacement, input: "0x", value: 0n },
    }),
  ).toBe(false);
  expect(
    replacementPreservesIntent({
      reason: "replaced",
      replacedTransaction: original,
      transaction: { ...replacement, value: 20n },
    }),
  ).toBe(false);
});
it("persists replacement hashes and metadata for reload recovery", () => {
  const values = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { setItem: (key: string, value: string) => values.set(key, value) },
  });
  try {
    const intent = {
      action: "create" as const,
      state: "pending" as const,
      reward: "0.01",
      metadata: {
        title: "A valid task title",
        description: "A short valid description",
        tags: [],
        category: "Development" as const,
      },
    };
    persistPendingTransaction({ ...intent, hash: "0x1111" });
    persistPendingTransaction({ ...intent, hash: "0x2222" });
    const saved = JSON.parse(values.get(pendingStorageKey)!);
    expect(saved.hash).toBe("0x2222");
    expect(saved.metadata.title).toBe(intent.metadata.title);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
