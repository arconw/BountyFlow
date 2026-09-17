import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isLocale } from "../../i18n/config";
import type { AccountMail } from "../auth/create-account-auth";
export async function accountTemplate(message: AccountMail) {
  const locale = isLocale(message.locale) ? message.locale : "en";
  const dictionary = JSON.parse(
    await readFile(resolve("public/locales", `${locale}.json`), "utf8"),
  ) as Record<string, string>;
  const heading =
    dictionary[message.kind === "verify" ? "mail_verify" : "mail_reset"];
  return {
    subject: `BountyBoard — ${heading}`,
    text: `${heading}\n\n${message.url}\n\n${dictionary.mail_ignore}`,
  };
}
