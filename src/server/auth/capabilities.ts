import "server-only";
import { googleConfiguration } from "./runtime-config";
import { mailConfigured } from "../mail/account-mail";
export function accountCapabilities() {
  return { google: !!googleConfiguration(), email: mailConfigured() };
}
