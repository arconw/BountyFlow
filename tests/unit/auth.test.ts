import { afterEach, beforeEach, expect, it } from "vitest";
import { testDatabase } from "../helpers/database";
import { createWalletLinkService } from "../../src/server/services/wallet-link-service";
let database: Awaited<ReturnType<typeof testDatabase>>;
let userId: string;
const address = "0x1111111111111111111111111111111111111111";
const origin = new URL("http://localhost:3000");
beforeEach(async () => {
  database = await testDatabase();
  userId = (
    await database.db.user.create({
      data: {
        displayName: "Builder",
        email: "builder@example.test",
        emailVerified: true,
      },
    })
  ).id;
});
afterEach(async () => {
  await database.close();
});
it("links wallets without creating users or sessions, consumes proof once", async () => {
  const service = createWalletLinkService(database.db, async () => true, 31337);
  const challenge = await service.challenge(userId, address, origin);
  await service.verify(userId, challenge.handle, "0x12");
  expect((await service.list(userId)).length).toBe(1);
  expect(await database.db.user.count()).toBe(1);
  expect(await database.db.authSession.count()).toBe(0);
  expect(await database.db.session.count()).toBe(0);
  await expect(
    service.verify(userId, challenge.handle, "0x12"),
  ).rejects.toMatchObject({ code: "AUTH_EXPIRED" });
});
it("requires a verified account before wallet challenge", async () => {
  const service = createWalletLinkService(database.db, async () => true, 31337);
  await expect(
    service.challenge("missing", address, origin),
  ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
});
it("binds proof to its account and rejects invalid signatures", async () => {
  const service = createWalletLinkService(
    database.db,
    async () => false,
    31337,
  );
  const proof = await service.challenge(userId, address, origin);
  await expect(
    service.verify("other", proof.handle, "0x12"),
  ).rejects.toMatchObject({ code: "AUTH_EXPIRED" });
  await expect(
    service.verify(userId, proof.handle, "0x12"),
  ).rejects.toMatchObject({ code: "INVALID_SIGNATURE" });
  expect(await database.db.wallet.count()).toBe(0);
});
it("supports multiple wallets but refuses stealing another account wallet", async () => {
  const service = createWalletLinkService(database.db, async () => true, 31337);
  for (const value of [
    address,
    "0x2222222222222222222222222222222222222222",
  ] as const) {
    const proof = await service.challenge(userId, value, origin);
    await service.verify(userId, proof.handle, "0x12");
  }
  expect((await service.list(userId)).length).toBe(2);
  const other = await database.db.user.create({
    data: {
      displayName: "Other",
      email: "other@example.test",
      emailVerified: true,
    },
  });
  const proof = await service.challenge(other.id, address, origin);
  await expect(
    service.verify(other.id, proof.handle, "0x12"),
  ).rejects.toMatchObject({ code: "WALLET_ALREADY_LINKED" });
});
it("rejects expired proof and concurrent replays", async () => {
  const service = createWalletLinkService(database.db, async () => true, 31337);
  const old = await service.challenge(userId, address, origin);
  await database.db.authChallenge.updateMany({
    data: { expiresAt: new Date(0) },
  });
  await expect(
    service.verify(userId, old.handle, "0x12"),
  ).rejects.toMatchObject({ code: "AUTH_EXPIRED" });
  const proof = await service.challenge(userId, address, origin);
  const results = await Promise.allSettled([
    service.verify(userId, proof.handle, "0x12"),
    service.verify(userId, proof.handle, "0x12"),
  ]);
  expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
});
