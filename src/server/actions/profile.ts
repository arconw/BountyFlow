"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentAccount } from "../auth/current-account";
import { db } from "../db";
import { createProfileService } from "../services/profile-service";
import { profileSchema } from "../../lib/profile-schema";
import { actionResult } from "./result";
export async function saveProfile(value: unknown) {
  return actionResult(async () => {
    const current = await requireCurrentAccount();
    const profile = await createProfileService(db).update(
      current.user.id,
      profileSchema.parse(value),
    );
    revalidatePath("/profile");
    return profile;
  });
}
