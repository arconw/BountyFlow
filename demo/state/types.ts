import type { Bounty } from "@/types/bounty";

export type DemoRole = "creator" | "contributor";
export type DemoProfile = {
  name: string;
  bio: string;
  skills: string[];
  website: string;
};
export type DemoAction = "create" | "accept" | "release" | "cancel";
export type DemoActivity = {
  action: DemoAction;
  bountyId: number;
  actor: DemoRole;
  reward: string;
  date: string;
};
export type DemoState = {
  version: 1;
  role: DemoRole;
  bounties: Bounty[];
  profiles: Record<DemoRole, DemoProfile>;
  balances: Record<DemoRole, string>;
  activity: DemoActivity[];
};
export type DemoCreateFields = {
  title: string;
  description: string;
  skills: string[];
  category: string;
  reward: string;
};
export type DemoRequest =
  | { action: "create"; fields: DemoCreateFields }
  | { action: Exclude<DemoAction, "create">; bountyId: number };
export type DemoTransaction = {
  request: DemoRequest;
  actor: DemoRole;
  reward: string;
  stage: "confirm" | "pending" | "success" | "rejected" | "failed";
  bountyId?: number;
  error?: string;
};
