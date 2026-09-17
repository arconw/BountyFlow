"use client";

import { useFormatter, useNow } from "next-intl";

export function BountyAge({
  createdAt,
  fallback = "",
}: {
  createdAt?: string;
  fallback?: string;
}) {
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const date = createdAt ? new Date(createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) return <>{fallback}</>;
  return (
    <time
      dateTime={date.toISOString()}
      title={format.dateTime(date, { dateStyle: "long", timeStyle: "short" })}
    >
      {format.relativeTime(date, now)}
    </time>
  );
}
