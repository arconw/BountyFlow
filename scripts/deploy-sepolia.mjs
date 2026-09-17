import { readFile, writeFile } from "node:fs/promises";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const signerUrl = process.env.SIGNER_RPC_URL;
if (!rpcUrl || !signerUrl)
  throw new Error(
    "Configure SEPOLIA_RPC_URL and a wallet-managed SIGNER_RPC_URL. This script never reads private keys.",
  );
const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
const wallet = createWalletClient({
  chain: sepolia,
  transport: http(signerUrl),
});
if (
  (await client.getChainId()) !== sepolia.id ||
  (await wallet.getChainId()) !== sepolia.id
)
  throw new Error("Both endpoints must use Sepolia");
const [account] = await wallet.getAddresses();
if (!account)
  throw new Error("Unlock a deployment account in your signing wallet");
const artifact = JSON.parse(
  await readFile("artifacts/BountyBoard.json", "utf8"),
);
const hash = await wallet.deployContract({
  account,
  abi: artifact.abi,
  bytecode: artifact.bytecode,
});
const receipt = await client.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress)
  throw new Error("Deployment failed");
await writeFile(
  "config/network.json",
  JSON.stringify(
    {
      chainId: sepolia.id,
      name: "Sepolia",
      rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
      contractAddress: receipt.contractAddress,
      deploymentBlock: Number(receipt.blockNumber),
      explorerUrl: "https://sepolia.etherscan.io",
    },
    null,
    2,
  ) + "\n",
);
process.stdout.write(`Sepolia contract deployed: ${receipt.contractAddress}\n`);
