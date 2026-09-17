import type { z } from "zod";
import type { bountySchema } from "@/lib/bounty-schema";

export type Bounty = z.infer<typeof bountySchema>;
export type BountyStatus = Bounty["status"];
