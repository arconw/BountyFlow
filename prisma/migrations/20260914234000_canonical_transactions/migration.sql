-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChainTransaction" (
    "isCanonical" BOOLEAN NOT NULL DEFAULT true,
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
INSERT INTO "new_ChainTransaction" ("action", "block", "bountyId", "chainId", "createdAt", "deploymentId", "hash", "id") SELECT "action", "block", "bountyId", "chainId", "createdAt", "deploymentId", "hash", "id" FROM "ChainTransaction";
DROP TABLE "ChainTransaction";
ALTER TABLE "new_ChainTransaction" RENAME TO "ChainTransaction";
CREATE INDEX "ChainTransaction_bountyId_idx" ON "ChainTransaction"("bountyId");
CREATE UNIQUE INDEX "ChainTransaction_deploymentId_hash_key" ON "ChainTransaction"("deploymentId", "hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
