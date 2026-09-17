import { formatEther, parseEther } from "viem";
import { z } from "zod";
import { bountySchema } from "@/lib/bounty-schema";
import type { Bounty } from "@/types/bounty";
import { skillCatalog, maxSelectedSkills } from "@/content/skills";
import { demoBounties, lastDemoId, firstDemoId } from "../fixtures/bounties";
import { demoPeople } from "../fixtures/people";
import type { DemoProfile, DemoRequest, DemoRole, DemoState } from "./types";

const roles = ["creator", "contributor"] as const;
const skills = z
  .array(
    z.string().refine((value) => skillCatalog.some((skill) => skill === value)),
  )
  .max(maxSelectedSkills);
export const demoProfileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  bio: z.string().max(400),
  skills,
  website: z.union([
    z.literal(""),
    z
      .url()
      .refine((value) => ["http:", "https:"].includes(new URL(value).protocol)),
  ]),
});
const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/)
  .max(30);
const stateSchema = z.object({
  version: z.literal(1),
  role: z.enum(roles),
  bounties: z
    .array(
      bountySchema.extend({
        id: z.number().int().min(firstDemoId).max(lastDemoId),
      }),
    )
    .max(64),
  profiles: z.object({
    creator: demoProfileSchema,
    contributor: demoProfileSchema,
  }),
  balances: z.object({ creator: amountSchema, contributor: amountSchema }),
  activity: z
    .array(
      z.object({
        action: z.enum(["create", "accept", "release", "cancel"]),
        bountyId: z.number().int(),
        actor: z.enum(roles),
        reward: amountSchema,
        date: z.iso.datetime(),
      }),
    )
    .max(200),
});

export function initialDemoState(): DemoState {
  return {
    version: 1,
    role: "contributor",
    bounties: structuredClone(demoBounties),
    profiles: {
      creator: structuredClone(demoPeople.creator.profile),
      contributor: structuredClone(demoPeople.contributor.profile),
    },
    balances: { creator: "2.5", contributor: "1.25" },
    activity: [],
  };
}

export function restoreDemoState(value: unknown): DemoState {
  const result = stateSchema.safeParse(value);
  return result.success ? result.data : initialDemoState();
}

export function updateDemoProfile(
  state: DemoState,
  profile: DemoProfile,
): DemoState {
  return {
    ...state,
    profiles: {
      ...state.profiles,
      [state.role]: demoProfileSchema.parse(profile),
    },
  };
}

export function executeDemoRequest(
  state: DemoState,
  request: DemoRequest,
  actor: DemoRole,
) {
  const person = demoPeople[actor];
  let bounty: Bounty;
  let bounties = state.bounties;
  const balances = { ...state.balances };
  if (request.action === "create") {
    const fields = z
      .object({
        title: z.string().trim().min(8).max(120),
        description: z.string().trim().min(20).max(6000),
        skills,
        category: z.enum(["Development", "Design", "Writing", "Research"]),
        reward: amountSchema.refine((value) => parseEther(value) > 0n),
      })
      .safeParse(request.fields);
    if (!fields.success) throw new Error("demo_invalid_input");
    const id =
      Math.max(...state.bounties.map((item) => item.id), firstDemoId - 1) + 1;
    if (id > lastDemoId) throw new Error("demo_limit");
    const amount = parseEther(fields.data.reward);
    if (amount > parseEther(balances[actor]))
      throw new Error("insufficient_balance");
    balances[actor] = formatEther(parseEther(balances[actor]) - amount);
    bounty = {
      id,
      title: fields.data.title,
      description: fields.data.description,
      tags: fields.data.skills,
      category: fields.data.category,
      reward: formatEther(amount),
      status: "Open" as const,
      creator: person.username,
      creatorUserId: person.id,
      organization: person.username,
      initial: state.profiles[actor].name.slice(0, 1).toUpperCase(),
      color: "mint",
      age: "",
      createdAt: new Date().toISOString(),
    };
    bounties = [bounty, ...bounties];
  } else {
    const current = bounties.find((item) => item.id === request.bountyId);
    if (!current) throw new Error("demo_not_available");
    const mine = current.creatorUserId === person.id;
    if (request.action === "accept") {
      if (current.status !== "Open" || mine)
        throw new Error("demo_not_available");
      bounty = {
        ...current,
        status: "In progress" as const,
        contributorUserId: person.id,
        contributorName: person.username,
      };
    } else if (request.action === "release") {
      if (!mine || current.status !== "In progress")
        throw new Error("demo_not_available");
      const worker = roles.find(
        (role) => demoPeople[role].id === current.contributorUserId,
      );
      if (!worker) throw new Error("demo_not_available");
      balances[worker] = formatEther(
        parseEther(balances[worker]) + parseEther(current.reward),
      );
      bounty = { ...current, status: "Completed" as const };
    } else {
      if (!mine || current.status !== "Open")
        throw new Error("demo_not_available");
      balances[actor] = formatEther(
        parseEther(balances[actor]) + parseEther(current.reward),
      );
      bounty = { ...current, status: "Cancelled" as const };
    }
    bounties = bounties.map((item) => (item.id === bounty.id ? bounty : item));
  }
  return {
    state: {
      ...state,
      bounties,
      balances,
      activity: [
        {
          action: request.action,
          bountyId: bounty.id,
          actor,
          reward: bounty.reward,
          date: new Date().toISOString(),
        },
        ...state.activity,
      ].slice(0, 200),
    },
    bountyId: bounty.id,
  };
}
