import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createPublicClient, http } from "viem";
import { appChain } from "../src/blockchain/config";
import { createDatabase } from "../src/server/create-database";
import { databaseUrl } from "../src/server/database-url";
import { reviewAccountInput } from "./review-input";

const origin = new URL(process.env.APP_ORIGIN ?? "http://localhost:3000");
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ||
  appChain.id !== 31337
)
  throw new Error("Review accounts are only available for local development");
if (
  (await createPublicClient({
    chain: appChain,
    transport: http(),
  }).getChainId()) !== 31337
)
  throw new Error("Review account requires the local test chain");
const db = createDatabase(databaseUrl());
try {
  const reviewAccount = await reviewAccountInput();
  if (
    await db.user.count({
      where: {
        OR: [
          { username: reviewAccount.username },
          { email: reviewAccount.email },
        ],
      },
    })
  )
    throw new Error(
      "Review account already exists; existing credentials were not changed",
    );
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      username: reviewAccount.username,
      email: reviewAccount.email,
      emailVerified: true,
      displayName: reviewAccount.name,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(reviewAccount.password),
        },
      },
    },
  });
  process.stdout.write("Local review account created.\n");
} finally {
  await db.$disconnect();
}
