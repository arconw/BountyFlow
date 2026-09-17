import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client";
import type { Address, Hex } from "viem";
import { ApiError } from "../http/errors";

export const challengeCookieName = "bountyboard_wallet_link";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
type SignatureVerifier = (
  message: string,
  signature: Hex,
  address: Address,
) => Promise<boolean>;

export function createWalletLinkService(
  db: PrismaClient,
  verifySignature: SignatureVerifier,
  chainId: number,
) {
  return {
    async challenge(userId: string, address: Address, origin: URL) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user?.emailVerified) throw new ApiError("AUTH_REQUIRED", 401);
      const handle = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 5 * 60_000);
      const message = [
        "Link wallet to BountyBoard",
        "",
        `Account: ${userId}`,
        `Wallet: ${address}`,
        `Network: ${chainId}`,
        `Origin: ${origin.origin}`,
        `Nonce: ${randomBytes(16).toString("hex")}`,
        `Expires: ${expiresAt.toISOString()}`,
        "",
        "This signature only links your wallet. It does not sign you in or transfer funds.",
      ].join("\n");
      await db.authChallenge.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      await db.authChallenge.create({
        data: {
          id: digest(handle),
          userId,
          address: address.toLowerCase(),
          message,
          expiresAt,
        },
      });
      return { handle, message };
    },
    async verify(userId: string, handle: string | undefined, signature: Hex) {
      if (!handle) throw new ApiError("AUTH_EXPIRED", 401);
      const id = digest(handle);
      const challenge = await db.authChallenge.findUnique({ where: { id } });
      if (
        !challenge ||
        challenge.userId !== userId ||
        challenge.expiresAt <= new Date()
      )
        throw new ApiError("AUTH_EXPIRED", 401);
      if (
        !(await verifySignature(
          challenge.message,
          signature,
          challenge.address as Address,
        ))
      )
        throw new ApiError("INVALID_SIGNATURE", 401);
      await db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user?.emailVerified) throw new ApiError("AUTH_REQUIRED", 401);
        const consumed = await tx.authChallenge.deleteMany({
          where: { id, userId, expiresAt: { gt: new Date() } },
        });
        if (consumed.count !== 1) throw new ApiError("AUTH_EXPIRED", 401);
        const wallet = await tx.wallet.findUnique({
          where: { address: challenge.address },
          include: { user: true },
        });
        if (wallet && wallet.userId !== userId && wallet.user.email)
          throw new ApiError("WALLET_ALREADY_LINKED", 409);
        await tx.wallet.upsert({
          where: { address: challenge.address },
          update: { userId },
          create: { address: challenge.address, chainId, userId },
        });
        await tx.bounty.updateMany({
          where: { creatorAddress: challenge.address },
          data: { creatorId: userId },
        });
        await tx.bounty.updateMany({
          where: { workerAddress: challenge.address },
          data: { contributorId: userId },
        });
      });
    },
    async list(userId: string) {
      return db.wallet.findMany({
        where: { userId },
        select: { id: true, address: true, chainId: true },
        orderBy: { createdAt: "asc" },
      });
    },
  };
}
