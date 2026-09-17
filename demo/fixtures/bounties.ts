import type { Bounty } from "@/types/bounty";
import { demoPeople } from "./people";

const tasks = [
  {
    id: 109,
    title: "Fix wallet reconnect on network change",
    description:
      "Help make wallet connections feel seamless. Investigate and fix the reconnect flow when switching networks.",
    tags: ["TypeScript", "React", "wagmi"],
    reward: "0.08",
    status: "Open",
    category: "Development",
    age: "2 hours ago",
  },
  {
    id: 108,
    title: "Design an on-chain activity dashboard",
    description:
      "Turn transaction data into a clear, thoughtful dashboard. We’re looking for a fresh take on the details.",
    tags: ["Figma", "UI / UX", "Design system"],
    reward: "0.15",
    status: "Open",
    category: "Design",
    age: "3 hours ago",
  },
  {
    id: 107,
    title: "Build a reusable token approval hook",
    description:
      "Create a typed React hook for ERC-20 approvals, with allowance checks and transaction state handling.",
    tags: ["React", "viem", "Solidity"],
    reward: "0.12",
    status: "In progress",
    category: "Development",
    age: "5 hours ago",
  },
  {
    id: 106,
    title: "Write a guide to gasless transactions",
    description:
      "Make account abstraction approachable. Write a practical, developer-first guide with working examples.",
    tags: ["Technical writing", "ERC-4337"],
    reward: "0.06",
    status: "Open",
    category: "Writing",
    age: "6 hours ago",
  },
  {
    id: 105,
    title: "Add test coverage for the escrow contract",
    description:
      "Help us ship with confidence. Cover edge cases for deposits, bounty acceptance, and reward releases.",
    tags: ["Solidity", "Foundry", "Testing"],
    reward: "0.20",
    status: "Open",
    category: "Development",
    age: "8 hours ago",
  },
  {
    id: 104,
    title: "Improve mobile wallet connection UX",
    description:
      "Polish the small-screen experience with better wallet discovery, clearer feedback, and deep linking.",
    tags: ["React", "Mobile", "WalletConnect"],
    reward: "0.10",
    status: "Completed",
    category: "Development",
    age: "Yesterday",
  },
  {
    id: 103,
    title: "Create accessible transaction notifications",
    description:
      "Build screen-reader-friendly notifications that make every stage of a transaction easy to follow.",
    tags: ["Accessibility", "React"],
    reward: "0.07",
    status: "Open",
    category: "Development",
    age: "Yesterday",
  },
  {
    id: 102,
    title: "Document the bounty contract events",
    description:
      "Write concise reference documentation for the contract’s events, parameters, and common usage patterns.",
    tags: ["Documentation", "Solidity"],
    reward: "0.04",
    status: "In progress",
    category: "Writing",
    age: "2 days ago",
  },
  {
    id: 101,
    title: "Explore a contributor reputation system",
    description:
      "Research simple, privacy-conscious ways to represent a contributor’s completed work and experience.",
    tags: ["Research", "Product"],
    reward: "0.09",
    status: "Cancelled",
    category: "Research",
    age: "3 days ago",
  },
] as const;

export const firstDemoId = 101;
export const lastDemoId = 164;
export const demoBounties: Bounty[] = tasks.map((task, index) => ({
  ...task,
  tags: [...task.tags],
  creator: demoPeople.creator.username,
  creatorUserId: demoPeople.creator.id,
  organization: demoPeople.creator.username,
  initial: "N",
  color: ["mint", "blue", "sand", "rose", "lavender"][index % 5],
  ...(["In progress", "Completed"].includes(task.status)
    ? {
        contributorUserId: demoPeople.contributor.id,
        contributorName: demoPeople.contributor.username,
      }
    : {}),
}));
