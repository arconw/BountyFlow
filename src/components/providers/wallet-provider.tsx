"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  useConnection,
  useBalance,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { formatEther } from "viem";
import { appChain } from "@/blockchain/config";
import { WalletDialog } from "@/components/wallet/wallet-dialog";
import { blockchainErrorKey } from "@/blockchain/errors";

type WalletState = {
  connected: boolean;
  address?: `0x${string}`;
  shortAddress: string;
  network: string;
  wrongNetwork: boolean;
  balance?: bigint;
  formattedBalance: string;
  openWallet: () => void;
  disconnect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  networkError: string | null;
  switching: boolean;
};
const WalletContext = createContext<WalletState | null>(null);
export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("WalletProvider is required");
  return value;
}
export function WalletProvider({ children }: { children: ReactNode }) {
  const connection = useConnection();
  const auth = useAuth();
  const router = useRouter();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();
  const balance = useBalance({
    address: connection.address,
    chainId: appChain.id,
    query: { enabled: !!connection.address, refetchInterval: 15_000 },
  });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!auth.authenticated) setOpen(false);
  }, [auth.authenticated]);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const address = connection.address;
  const value: WalletState = {
    connected: connection.isConnected,
    address,
    shortAddress: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "",
    network:
      connection.chain?.name ?? String(connection.chainId ?? appChain.name),
    wrongNetwork: connection.isConnected && connection.chainId !== appChain.id,
    balance: balance.data?.value,
    formattedBalance: balance.data
      ? Number(formatEther(balance.data.value)).toFixed(4)
      : "—",
    openWallet: () => {
      if (auth.authenticated) setOpen(true);
      else router.push("/login");
    },
    disconnect: async () => {
      await disconnect.mutateAsync({});
      setOpen(false);
    },
    switchNetwork: async () => {
      setNetworkError(null);
      try {
        await switchChain.mutateAsync({ chainId: appChain.id });
      } catch (error) {
        setNetworkError(blockchainErrorKey(error));
      }
    },
    networkError,
    switching: switchChain.isPending,
  };
  return (
    <WalletContext.Provider value={value}>
      {children}
      {open && <WalletDialog onClose={() => setOpen(false)} />}
    </WalletContext.Provider>
  );
}
