import "server-only";
import { redirect } from "next/navigation";
import { currentAccount } from "./current-account";
export async function requirePageAccount() {
  const current = await currentAccount();
  if (!current) redirect("/login");
  return current;
}
