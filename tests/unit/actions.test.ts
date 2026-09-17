import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "../../src/server/http/errors";
const mocks = vi.hoisted(() => ({
  account: vi.fn(),
  update: vi.fn(),
  confirm: vi.fn(),
  wallets: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("../../src/server/auth/current-account", () => ({
  requireCurrentAccount: mocks.account,
}));
vi.mock("../../src/server/db", () => ({ db: {} }));
vi.mock("../../src/server/services/profile-service", () => ({
  createProfileService: () => ({ update: mocks.update }),
}));
vi.mock("../../src/server/services/bounties", () => ({
  bounties: { confirm: mocks.confirm },
}));
vi.mock("../../src/server/services/wallet-links", () => ({
  walletLinks: { list: mocks.wallets },
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));
import { saveProfile } from "../../src/server/actions/profile";
import {
  authorizeTransaction,
  confirmTransaction,
} from "../../src/server/actions/transactions";
const profile = { name: "Builder", bio: "", website: "", skills: ["React"] };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.account.mockResolvedValue({
    user: { id: "signed-in-user", username: "builder" },
  });
  mocks.update.mockResolvedValue(profile);
});
it("rejects unauthenticated actions before any write or transaction lookup", async () => {
  mocks.account.mockRejectedValue(new ApiError("AUTH_REQUIRED", 401));
  expect((await saveProfile(profile)).error).toBe("AUTH_REQUIRED");
  expect((await confirmTransaction(`0x${"1".repeat(64)}`)).error).toBe(
    "AUTH_REQUIRED",
  );
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.confirm).not.toHaveBeenCalled();
});
it("derives profile ownership from the session and strips submitted owner fields", async () => {
  expect(
    (await saveProfile({ ...profile, userId: "another-user" })).error,
  ).toBeNull();
  expect(mocks.update).toHaveBeenCalledWith("signed-in-user", profile);
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
});
it("validates action inputs before services and leaves caches untouched on failure", async () => {
  expect(
    (await saveProfile({ ...profile, website: "javascript:alert(1)" })).error,
  ).toBe("INVALID_INPUT");
  expect((await confirmTransaction("invalid-hash")).error).toBe(
    "INVALID_INPUT",
  );
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.revalidateTag).not.toHaveBeenCalled();
});
it("checks linked wallet ownership against the current account", async () => {
  const address = `0x${"1".repeat(40)}`;
  mocks.wallets.mockResolvedValue([]);
  expect((await authorizeTransaction(address)).data).toBe(false);
  mocks.wallets.mockResolvedValue([{ address }]);
  expect((await authorizeTransaction(address)).data).toBe(true);
  expect(mocks.wallets).toHaveBeenCalledWith("signed-in-user");
});
it("invalidates catalog data and route output only after confirmed indexing", async () => {
  mocks.confirm.mockResolvedValue({ bountyId: 42 });
  expect((await confirmTransaction(`0x${"1".repeat(64)}`)).data).toEqual({
    bountyId: 42,
  });
  expect(mocks.revalidateTag).toHaveBeenCalledWith("bounties", { expire: 0 });
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
});
it("does not expose database or RPC exception messages", async () => {
  mocks.update.mockRejectedValue(
    new Error("internal database connection details"),
  );
  expect(await saveProfile(profile)).toEqual({
    data: null,
    error: "SERVICE_UNAVAILABLE",
  });
});
