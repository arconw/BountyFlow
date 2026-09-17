import { accountTemplate } from "./account-template";
import { createTransport } from "nodemailer";
import type { AccountMail } from "../auth/create-account-auth";

export function mailConfigured() {
  return !!process.env.SMTP_HOST && !!process.env.MAIL_FROM;
}
export async function sendAccountMail(message: AccountMail) {
  if (!mailConfigured()) throw new Error("MAIL_NOT_CONFIGURED");
  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
    logger: false,
    debug: false,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: message.to,
    ...(await accountTemplate(message)),
  });
}
