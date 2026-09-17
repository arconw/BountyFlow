import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "../src/generated/prisma/client";
import { demoUsers } from "./fixtures/users";

export async function seedDemoData(
  db: PrismaClient,
  addresses: readonly string[],
) {
  for (const fixture of demoUsers) {
    const address = addresses[fixture.walletIndex]?.toLowerCase();
    if (!address) throw new Error("Demo wallet addresses are required");
    const user = await db.user.upsert({
      where: { email: fixture.email },
      update: { email: fixture.email },
      create: {
        email: fixture.email,
        emailVerified: true,
        username: fixture.username,
        displayName: fixture.displayName,
        bio: fixture.bio,
        website: fixture.website,
        skills: {
          connectOrCreate: fixture.skills.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
    });
    const account = await db.authAccount.findUnique({
      where: {
        providerId_accountId: { providerId: "credential", accountId: user.id },
      },
    });
    if (!account)
      await db.authAccount.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: await hashPassword(randomBytes(32).toString("base64")),
        },
      });
    const wallet = await db.wallet.findUnique({
      where: { address },
      include: { user: { select: { email: true } } },
    });
    if (wallet && wallet.userId !== user.id && wallet.user.email) continue;
    await db.wallet.upsert({
      where: { address },
      create: { address, chainId: 31337, userId: user.id },
      update: { userId: user.id },
    });
    await db.bounty.updateMany({
      where: { creatorAddress: address },
      data: { creatorId: user.id },
    });
    await db.bounty.updateMany({
      where: { workerAddress: address },
      data: { contributorId: user.id },
    });
  }
}
