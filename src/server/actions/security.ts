"use server";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireCurrentAccount } from "../auth/current-account";
import { getAccountAuth } from "../auth/account-auth";
import { setAccountAccess } from "../auth/set-account-access";
import { ApiError } from "../http/errors";
import { actionResult } from "./result";
export async function setAccountPassword(value: unknown) {
  return actionResult(async () => {
    await requireCurrentAccount();
    const password = z.string().min(12).max(128).parse(value);
    const response = await setAccountAccess(
      getAccountAuth(),
      await headers(),
      password,
    );
    if (!response.ok) throw new ApiError("INVALID_INPUT", response.status);
    revalidatePath("/profile");
    return true;
  });
}
export async function refreshAccount() {
  return actionResult(async () => {
    await requireCurrentAccount();
    revalidateTag("bounties", { expire: 0 });
    revalidatePath("/", "layout");
    return true;
  });
}
