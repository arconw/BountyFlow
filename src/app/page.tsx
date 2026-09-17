import { Board } from "@/components/board";
import { listBounties } from "@/server/data/catalog";
export default async function Home() {
  return <Board bounties={await listBounties()} />;
}
