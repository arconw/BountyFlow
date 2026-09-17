-- CreateTable
CREATE TABLE "ChainDeployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" INTEGER NOT NULL,
    "contract" TEXT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "startBlock" TEXT NOT NULL,
    "cursor" TEXT NOT NULL,
    "cursorHash" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bounty" (
    "deploymentId" TEXT,
    "isCanonical" BOOLEAN NOT NULL DEFAULT true,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chainId" INTEGER,
    "contract" TEXT,
    "onchainId" TEXT,
    "creatorAddress" TEXT,
    "workerAddress" TEXT,
    "syncedAt" DATETIME,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "initial" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "creatorLabel" TEXT NOT NULL,
    "demoMine" BOOLEAN NOT NULL DEFAULT false,
    "demoAccepted" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "contributorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bounty_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "ChainDeployment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bounty_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bounty_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bounty" ("age", "category", "chainId", "color", "contract", "contributorId", "createdAt", "creatorAddress", "creatorId", "creatorLabel", "demoAccepted", "demoMine", "description", "id", "initial", "onchainId", "organization", "reward", "status", "syncedAt", "title", "updatedAt", "workerAddress") SELECT "age", "category", "chainId", "color", "contract", "contributorId", "createdAt", "creatorAddress", "creatorId", "creatorLabel", "demoAccepted", "demoMine", "description", "id", "initial", "onchainId", "organization", "reward", "status", "syncedAt", "title", "updatedAt", "workerAddress" FROM "Bounty";
DROP TABLE "Bounty";
ALTER TABLE "new_Bounty" RENAME TO "Bounty";
CREATE INDEX "Bounty_chainId_contract_idx" ON "Bounty"("chainId", "contract");
CREATE INDEX "Bounty_status_category_idx" ON "Bounty"("status", "category");
CREATE INDEX "Bounty_creatorId_idx" ON "Bounty"("creatorId");
CREATE INDEX "Bounty_contributorId_idx" ON "Bounty"("contributorId");
CREATE UNIQUE INDEX "Bounty_deploymentId_onchainId_key" ON "Bounty"("deploymentId", "onchainId");
CREATE TABLE "new_ChainTransaction" (
    "deploymentId" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "bountyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChainTransaction_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "ChainDeployment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChainTransaction_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChainTransaction" ("action", "block", "bountyId", "chainId", "createdAt", "hash", "id") SELECT "action", "block", "bountyId", "chainId", "createdAt", "hash", "id" FROM "ChainTransaction";
DROP TABLE "ChainTransaction";
ALTER TABLE "new_ChainTransaction" RENAME TO "ChainTransaction";
CREATE INDEX "ChainTransaction_bountyId_idx" ON "ChainTransaction"("bountyId");
CREATE UNIQUE INDEX "ChainTransaction_deploymentId_hash_key" ON "ChainTransaction"("deploymentId", "hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ChainDeployment_chainId_contract_blockHash_key" ON "ChainDeployment"("chainId", "contract", "blockHash");
