import { db } from "../db";
import { createBountyService } from "./bounty-service";

export const bounties = createBountyService(db);
