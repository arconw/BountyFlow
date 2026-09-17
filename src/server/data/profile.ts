import "server-only";
import { db } from "../db";
import { requireCurrentAccount } from "../auth/current-account";
import { createProfileService } from "../services/profile-service";
import { emptyProfile } from "../../lib/profile-schema";
export async function accountProfile() {
  const current = await requireCurrentAccount();
  return (await createProfileService(db).get(current.user.id)) ?? emptyProfile;
}
export async function accountSecurity() {
  const current = await requireCurrentAccount();
  const accounts = await db.authAccount.findMany({
    where: { userId: current.user.id },
    select: { providerId: true },
  });
  return {
    hasPassword: accounts.some(
      (account) => account.providerId === "credential",
    ),
    google: accounts.some((account) => account.providerId === "google"),
  };
}
