import { createDatabase } from "../../src/server/create-database";
import { databaseUrl } from "../../src/server/database-url";

export async function catalogRecords() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress)
    throw new Error("Run browser tests through npm run test:e2e");
  const db = createDatabase(databaseUrl());
  try {
    return await db.bounty.findMany({
      where: {
        chainId: 31337,
        contract: contractAddress?.toLowerCase(),
        isCanonical: true,
        onchainId: { not: null },
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        onchainId: true,
        creatorId: true,
        creator: { select: { username: true } },
      },
    });
  } finally {
    await db.$disconnect();
  }
}
