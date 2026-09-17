import type { PrismaClient, Prisma } from "../../generated/prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;

export function createUserRepository(db: Database) {
  return {
    findWallet: (address: string) =>
      db.wallet.findUnique({
        where: { address: address.toLowerCase() },
        include: { user: { include: { skills: true } } },
      }),
    findUser: (id: string) =>
      db.user.findUnique({
        where: { id },
        include: { skills: true, wallets: true },
      }),
  };
}
