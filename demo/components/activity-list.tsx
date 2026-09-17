"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock3,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useDemo } from "../state/provider";
import { demoPeople } from "../fixtures/people";

const labels = {
  create: "bounty_created",
  accept: "bounty_accepted",
  release: "payment_released",
  cancel: "bounty_cancelled",
};
const icons = {
  create: ArrowUpRight,
  accept: ArrowDownLeft,
  release: Check,
  cancel: RotateCcw,
};

export function DemoActivityList({ bountyId }: { bountyId?: number }) {
  const t = useTranslations();
  const format = useFormatter();
  const { state } = useDemo();
  const activity = state.activity
    .filter((item) => bountyId === undefined || item.bountyId === bountyId)
    .slice(0, 8);
  return (
    <section className="demo-activity settings-card">
      <div className="settings-heading">
        <Clock3 size={18} />
        <div>
          <h2>{t("demo_activity")}</h2>
          <p>{t("demo_local_notice")}</p>
        </div>
      </div>
      {activity.length ? (
        <ul>
          {activity.map((item, index) => {
            const Icon = icons[item.action];
            return (
              <li key={`${item.date}-${index}`}>
                <span className="demo-activity-icon">
                  <Icon size={16} />
                </span>
                <div>
                  <Link href={`/bounty/${item.bountyId}/`}>
                    {t(labels[item.action])} · #{item.bountyId}
                  </Link>
                  <span>
                    {demoPeople[item.actor].username} ·{" "}
                    {format.dateTime(new Date(item.date), {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <strong>{item.reward} ETH</strong>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="demo-muted">{t("demo_no_activity")}</p>
      )}
    </section>
  );
}
