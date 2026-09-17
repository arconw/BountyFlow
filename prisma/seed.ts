import { createWalletClient, http } from "viem";
import { createDatabase } from "../src/server/create-database";
import { databaseUrl } from "../src/server/database-url";
import { createChainSyncService } from "../src/server/services/chain-sync-service";
import { appChain } from "../src/blockchain/config";
import { seedDemoData } from "./seed-data";
const wallet = createWalletClient({ chain: appChain, transport: http() });
if (appChain.id !== 31337 || (await wallet.getChainId()) !== 31337)
  throw new Error("Demo seeding requires local chain 31337");
const db = createDatabase(databaseUrl());
try {
  await seedDemoData(db, await wallet.getAddresses());
  await createChainSyncService(db).sync(true);
  process.stdout.write(
    "Demo profiles, accounts, wallets and indexed bounties are ready.\n",
  );
} finally {
  await db.$disconnect();
}
