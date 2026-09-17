import type { PrismaClient, Prisma } from "../../generated/prisma/client";

export const bountyInclude = {
  skills: { orderBy: { name: "asc" as const } },
  creator: true,
  contributor: true,
  transactions: {
    where: { isCanonical: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
};
export type BountyRecord = Prisma.BountyGetPayload<{
  include: typeof bountyInclude;
}>;

export function createBountyRepository(db: PrismaClient) {
  return {
    list: (deploymentId: string) =>
      db.bounty.findMany({
        where: { deploymentId, isCanonical: true },
        include: bountyInclude,
        orderBy: { id: "desc" },
      }),
    find: (id: number) =>
      db.bounty.findUnique({ where: { id }, include: bountyInclude }),
    upsert: (
      deploymentId: string,
      chainId: number,
      contract: string,
      onchainId: string,
      data: Omit<
        Prisma.BountyUncheckedCreateInput,
        "chainId" | "contract" | "onchainId"
      >,
      tags: string[],
    ) =>
      db.bounty.upsert({
        where: { deploymentId_onchainId: { deploymentId, onchainId } },
        create: {
          ...data,
          deploymentId,
          chainId,
          contract,
          onchainId,
          skills: {
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
        update: {
          ...data,
          skills: {
            set: [],
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      }),
  };
}
