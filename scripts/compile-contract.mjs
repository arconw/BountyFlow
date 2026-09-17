import fs from "node:fs/promises";
import solc from "solc";
import { format, resolveConfig } from "prettier";

const source = await fs.readFile(
  new URL("../contracts/BountyBoard.sol", import.meta.url),
  "utf8",
);
const result = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources: { "BountyBoard.sol": { content: source } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        evmVersion: "cancun",
        outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
      },
    }),
  ),
);
if (result.errors?.some((error) => error.severity === "error"))
  throw new Error(
    result.errors
      .filter((error) => error.severity === "error")
      .map((error) => error.formattedMessage)
      .join("\n"),
  );
const contract = result.contracts["BountyBoard.sol"].BountyBoard;
await fs.mkdir("artifacts", { recursive: true });
await fs.writeFile(
  "artifacts/BountyBoard.json",
  JSON.stringify({
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  }),
);
await fs.writeFile(
  "src/contracts/bounty-abi.ts",
  await format(
    `export const bountyAbi = ${JSON.stringify(contract.abi, null, 2)} as const;\n`,
    {
      ...(await resolveConfig("src/contracts/bounty-abi.ts")),
      parser: "typescript",
    },
  ),
);
