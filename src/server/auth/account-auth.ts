import { db } from "../db";
import { createAccountAuth } from "./create-account-auth";
import {
  accountOrigin,
  encryptionKey,
  googleConfiguration,
  trustedIpHeader,
} from "./runtime-config";
import { sendAccountMail } from "../mail/account-mail";

let instance: ReturnType<typeof createAccountAuth> | undefined;
export function getAccountAuth() {
  return (instance ??= createAccountAuth(db, {
    origin: accountOrigin(),
    encryptionKey: encryptionKey(),
    google: googleConfiguration(),
    sendMail: sendAccountMail,
    trustedIpHeader: trustedIpHeader(),
  }));
}
