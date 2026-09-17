"use client";
import { useState, useTransition } from "react";
import { useConnection, useSignMessage } from "wagmi";
import { useAuth } from "./use-auth";
import { challengeWallet, verifyWallet } from "@/server/actions/wallet";
export function useWalletLink() {
  const auth = useAuth();
  const { address } = useConnection();
  const signer = useSignMessage();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<unknown>(null);
  const linked =
    !!address &&
    !!auth.session?.wallets.some(
      (wallet) => wallet.address.toLowerCase() === address.toLowerCase(),
    );
  function link() {
    startTransition(async () => {
      setError(null);
      try {
        if (!address || !auth.authenticated) throw new Error("AUTH_REQUIRED");
        const challenge = await challengeWallet({ address });
        if (challenge.error || !challenge.data)
          throw new Error(challenge.error ?? "AUTH_REQUIRED");
        const signature = await signer.mutateAsync({
          message: challenge.data.message,
          account: address,
        });
        const result = await verifyWallet({ signature });
        if (result.error) throw new Error(result.error);
      } catch (error) {
        setError(error);
      }
    });
  }
  return { auth, linked, link, pending, error };
}
