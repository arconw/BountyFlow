import { readFile, writeFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  type Hex,
} from "viem";
import { hardhat } from "viem/chains";
import { bountyAbi } from "../src/contracts/bounty-abi";
import { bounties } from "../prisma/fixtures/bounties";

const transport = http("http://127.0.0.1:8545");
const client = createPublicClient({ chain: hardhat, transport });
const wallet = createWalletClient({ chain: hardhat, transport });
if ((await client.getChainId()) !== 31337)
  throw new Error("Local deployment requires chain 31337");
const [creator, worker] = await wallet.getAddresses();
const artifact = JSON.parse(
  await readFile("artifacts/BountyBoard.json", "utf8"),
);
const hash = await wallet.deployContract({
  account: creator,
  abi: bountyAbi,
  bytecode: artifact.bytecode as Hex,
});
const receipt = await client.waitForTransactionReceipt({ hash });
if (!receipt.contractAddress || receipt.status !== "success")
  throw new Error("Deployment failed");
const address = receipt.contractAddress;
for (const bounty of [...bounties].reverse()) {
  const metadata = JSON.stringify({
    title: bounty.title,
    description: bounty.description,
    tags: bounty.tags,
    category: bounty.category,
  });
  const created = await wallet.writeContract({
    account: creator,
    address,
    abi: bountyAbi,
    functionName: "createBounty",
    args: [metadata],
    value: parseEther(bounty.reward),
  });
  await client.waitForTransactionReceipt({ hash: created });
  const id = await client.readContract({
    address,
    abi: bountyAbi,
    functionName: "bountyCount",
  });
  if (bounty.status === "In progress" || bounty.status === "Completed") {
    await client.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        account: worker,
        address,
        abi: bountyAbi,
        functionName: "acceptBounty",
        args: [id],
      }),
    });
  }
  if (bounty.status === "Completed" || bounty.status === "Cancelled") {
    await client.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        account: creator,
        address,
        abi: bountyAbi,
        functionName:
          bounty.status === "Completed" ? "completeBounty" : "cancelBounty",
        args: [id],
      }),
    });
  }
}
await writeFile(
  process.env.BOUNTY_NETWORK_OUTPUT ?? "config/network.json",
  JSON.stringify(
    {
      chainId: 31337,
      name: "Local EVM",
      rpcUrl: "http://127.0.0.1:8545",
      contractAddress: address,
      deploymentBlock: Number(receipt.blockNumber),
      explorerUrl: null,
    },
    null,
    2,
  ) + "\n",
);
process.stdout.write(`Local contract deployed: ${address}\n`);
