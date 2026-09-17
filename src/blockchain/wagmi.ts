import { createConfig, http } from "wagmi";
import { walletConnect } from "wagmi/connectors/walletConnect";
import { injected } from "wagmi/connectors";
import { appChain } from "./config";

export function createWagmiConfig() {
  return createConfig({
    chains: [appChain],
    connectors: [
      injected(),
      ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
        ? [
            walletConnect({
              projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
              showQrModal: true,
            }),
          ]
        : []),
    ],
    transports: { [appChain.id]: http() },
    ssr: true,
  });
}
