-- AlterTable
ALTER TABLE "Bounty" ADD COLUMN "chainId" INTEGER;
ALTER TABLE "Bounty" ADD COLUMN "contract" TEXT;
ALTER TABLE "Bounty" ADD COLUMN "creatorAddress" TEXT;
ALTER TABLE "Bounty" ADD COLUMN "onchainId" TEXT;
ALTER TABLE "Bounty" ADD COLUMN "syncedAt" DATETIME;
ALTER TABLE "Bounty" ADD COLUMN "workerAddress" TEXT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Session_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChainTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chainId" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "bountyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChainTransaction_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_walletId_idx" ON "Session"("walletId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthChallenge_expiresAt_idx" ON "AuthChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "ChainTransaction_bountyId_idx" ON "ChainTransaction"("bountyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChainTransaction_chainId_hash_key" ON "ChainTransaction"("chainId", "hash");

-- CreateIndex
CREATE UNIQUE INDEX "Bounty_chainId_contract_onchainId_key" ON "Bounty"("chainId", "contract", "onchainId");
