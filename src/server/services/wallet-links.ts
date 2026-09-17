import { db } from "../db";
import { publicClient } from "../../blockchain/client";
import { appChain } from "../../blockchain/config";
import { createWalletLinkService } from "./wallet-link-service";

export const walletLinks = createWalletLinkService(
  db,
  (message, signature, address) =>
    publicClient.verifyMessage({ message, signature, address }),
  appChain.id,
);
