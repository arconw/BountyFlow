import "server-only";
import { unstable_cache } from "next/cache";
import { bounties } from "../services/bounties";
import { appChain, contractAddress } from "../../blockchain/config";

const deployment = `${appChain.id}:${contractAddress}`;
export const listBounties = unstable_cache(
  () => bounties.list(),
  ["bounties", deployment],
  { revalidate: 15, tags: ["bounties"] },
);
export const findBounty = unstable_cache(
  (id: number) => bounties.find(id),
  ["bounty", deployment],
  { revalidate: 15, tags: ["bounties"] },
);
