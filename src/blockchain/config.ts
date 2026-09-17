import { defineChain, isAddress, type Address } from "viem";
import settings from "../../config/network.json";

export const appChain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? settings.chainId),
  name: process.env.NEXT_PUBLIC_CHAIN_NAME ?? settings.name,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? settings.rpcUrl] },
  },
  blockExplorers:
    (process.env.NEXT_PUBLIC_EXPLORER_URL ?? settings.explorerUrl)
      ? {
          default: {
            name: "Explorer",
            url: (process.env.NEXT_PUBLIC_EXPLORER_URL ??
              settings.explorerUrl)!,
          },
        }
      : undefined,
  testnet: true,
});
const configuredContract =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? settings.contractAddress;
export const contractAddress: Address | undefined = isAddress(
  configuredContract,
)
  ? configuredContract
  : undefined;
export const deploymentBlock = BigInt(
  process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK ?? settings.deploymentBlock ?? 0,
);
export function explorerLink(kind: "tx" | "address", value: string) {
  return appChain.blockExplorers?.default.url
    ? `${appChain.blockExplorers.default.url}/${kind}/${value}`
    : undefined;
}
