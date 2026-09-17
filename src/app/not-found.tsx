import { Text } from "@/i18n/text";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="empty-state not-found">
      <SearchX size={34} />
      <h1>
        <Text id="this_bounty_isn_t_here" />
      </h1>
      <p>
        <Text id="it_may_have_moved_or_the_link_may_be_incorrect" />
      </p>
      <Link href="/" className="button button-primary">
        <ArrowLeft size={15} />
        <Text id="explore_bounties" />
      </Link>
    </div>
  );
}
