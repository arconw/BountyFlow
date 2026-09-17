import { Text } from "@/i18n/text";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findBounty } from "@/server/data/catalog";
import { BountyDetail } from "@/components/bounty/bounty-detail";

export const dynamic = "force-dynamic";

export default async function BountyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  const bounty = await findBounty(Number(id));
  if (!bounty) notFound();
  return (
    <div className="detail-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        <Text id="back_to_bounties" />
      </Link>
      <BountyDetail bounty={bounty} />
    </div>
  );
}
