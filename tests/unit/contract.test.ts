import { readFile } from "node:fs/promises";
import { beforeAll, expect, it } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  encodeErrorResult,
  type Address,
  type Hex,
} from "viem";
import { hardhat } from "viem/chains";
import { bountyAbi } from "../../src/contracts/bounty-abi";
import { compileContractFixture } from "../helpers/compile-contract-fixture";

const transport = http("http://127.0.0.1:8545");
const client = createPublicClient({ chain: hardhat, transport });
const wallet = createWalletClient({ chain: hardhat, transport });
let creator: Address;
let worker: Address;
let stranger: Address;
let contract: Address;
beforeAll(async () => {
  if ((await client.getChainId()) !== 31337)
    throw new Error("Contract tests require the local chain 31337");
  [creator, worker, stranger] = await wallet.getAddresses();
  const artifact = JSON.parse(
    await readFile("artifacts/BountyBoard.json", "utf8"),
  );
  const hash = await wallet.deployContract({
    account: creator,
    abi: bountyAbi,
    bytecode: artifact.bytecode as Hex,
  });
  contract = (await client.waitForTransactionReceipt({ hash }))
    .contractAddress!;
});
const metadata = JSON.stringify({
  title: "Test a complete bounty lifecycle",
  description: "A realistic test of escrow permissions and payout.",
  tags: ["Solidity"],
  category: "Development",
});
async function create() {
  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      account: creator,
      address: contract,
      abi: bountyAbi,
      functionName: "createBounty",
      args: [metadata],
      value: parseEther("0.01"),
    }),
  });
  return client.readContract({
    address: contract,
    abi: bountyAbi,
    functionName: "bountyCount",
  });
}
it("locks funds, validates permissions and pays the worker exactly once", async () => {
  const id = await create();
  const own = { address: contract, abi: bountyAbi, args: [id] } as const;
  await expect(
    client.simulateContract({
      ...own,
      functionName: "acceptBounty",
      account: creator,
    }),
  ).rejects.toThrow();
  await expect(
    client.simulateContract({
      ...own,
      functionName: "completeBounty",
      account: creator,
    }),
  ).rejects.toThrow();
  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      ...own,
      functionName: "acceptBounty",
      account: worker,
    }),
  });
  await expect(
    client.simulateContract({
      ...own,
      functionName: "acceptBounty",
      account: stranger,
    }),
  ).rejects.toThrow();
  await expect(
    client.simulateContract({
      ...own,
      functionName: "completeBounty",
      account: worker,
    }),
  ).rejects.toThrow();
  await expect(
    client.simulateContract({
      ...own,
      functionName: "cancelBounty",
      account: creator,
    }),
  ).rejects.toThrow();
  const balance = await client.getBalance({ address: worker });
  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      ...own,
      functionName: "completeBounty",
      account: creator,
    }),
  });
  expect((await client.getBalance({ address: worker })) - balance).toBe(
    parseEther("0.01"),
  );
  expect(
    (await client.readContract({ ...own, functionName: "getBounty" })).status,
  ).toBe(2);
  await expect(
    client.simulateContract({
      ...own,
      functionName: "completeBounty",
      account: creator,
    }),
  ).rejects.toThrow();
});
it("only permits the creator to cancel an open bounty", async () => {
  const id = await create();
  const own = { address: contract, abi: bountyAbi, args: [id] } as const;
  await expect(
    client.simulateContract({
      ...own,
      functionName: "cancelBounty",
      account: stranger,
    }),
  ).rejects.toThrow();
  const before = await client.getBalance({ address: contract });
  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      ...own,
      functionName: "cancelBounty",
      account: creator,
    }),
  });
  expect(before - (await client.getBalance({ address: contract }))).toBe(
    parseEther("0.01"),
  );
  expect(
    (await client.readContract({ ...own, functionName: "getBounty" })).status,
  ).toBe(3);
});
it("rejects empty metadata, zero reward and invalid ids", async () => {
  await expect(
    client.simulateContract({
      address: contract,
      abi: bountyAbi,
      functionName: "createBounty",
      args: [metadata],
      account: creator,
    }),
  ).rejects.toThrow();
  await expect(
    client.simulateContract({
      address: contract,
      abi: bountyAbi,
      functionName: "createBounty",
      args: [""],
      value: parseEther("0.01"),
      account: creator,
    }),
  ).rejects.toThrow();
  await expect(
    client.readContract({
      address: contract,
      abi: bountyAbi,
      functionName: "getBounty",
      args: [9999n],
    }),
  ).rejects.toThrow();
});

it("retains escrow on a failed payout and blocks receiver reentrancy on retry", async () => {
  const fixture = await compileContractFixture("BountyReceiver");
  const deployment = await client.waitForTransactionReceipt({
    hash: await wallet.deployContract({ ...fixture, account: stranger }),
  });
  const receiver = deployment.contractAddress!;
  const id = await create();
  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      address: receiver,
      abi: fixture.abi,
      functionName: "accept",
      args: [contract, id],
      account: stranger,
    }),
  });
  const escrow = await client.getBalance({ address: contract });
  await expect(
    client.simulateContract({
      address: contract,
      abi: bountyAbi,
      functionName: "completeBounty",
      args: [id],
      account: creator,
    }),
  ).rejects.toThrow("TransferFailed");
  expect(
    (
      await client.readContract({
        address: contract,
        abi: bountyAbi,
        functionName: "getBounty",
        args: [id],
      })
    ).status,
  ).toBe(1);
  expect(await client.getBalance({ address: contract })).toBe(escrow);
  expect(await client.getBalance({ address: receiver })).toBe(0n);
  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      address: receiver,
      abi: fixture.abi,
      functionName: "allowPayment",
      account: stranger,
    }),
  });
  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      address: contract,
      abi: bountyAbi,
      functionName: "completeBounty",
      args: [id],
      account: creator,
    }),
  });
  expect(await client.getBalance({ address: receiver })).toBe(
    parseEther("0.01"),
  );
  expect(escrow - (await client.getBalance({ address: contract }))).toBe(
    parseEther("0.01"),
  );
  expect(
    await client.readContract({
      address: receiver,
      abi: fixture.abi,
      functionName: "reentrySucceeded",
    }),
  ).toBe(false);
  expect(
    await client.readContract({
      address: receiver,
      abi: fixture.abi,
      functionName: "reentryError",
    }),
  ).toBe(encodeErrorResult({ abi: bountyAbi, errorName: "ReentrantCall" }));
});
