import { DemoDetail } from "../../../components/detail";
import { firstDemoId, lastDemoId } from "../../../fixtures/bounties";

export function generateStaticParams() {
  return Array.from({ length: lastDemoId - firstDemoId + 1 }, (_, index) => ({
    id: String(firstDemoId + index),
  }));
}

export default async function DemoBountyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <DemoDetail id={Number((await params).id)} />;
}
