import { listBounties } from "@/server/data/catalog";
import { requirePageAccount } from "@/server/auth/page-account";
import { Board } from "@/components/board";

export default async function MyBounties() {
  const current = await requirePageAccount();
  const bounties = (await listBounties()).filter(
    (bounty) =>
      bounty.creatorUserId === current.user.id ||
      bounty.contributorUserId === current.user.id,
  );
  return <Board personal bounties={bounties} />;
}
