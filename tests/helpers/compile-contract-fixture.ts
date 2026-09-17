import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import type { Abi, Hex } from "viem";

const solc = createRequire(import.meta.url)("solc") as {
  compile: (input: string) => string;
};

export async function compileContractFixture(name: string) {
  const source = await readFile(`tests/fixtures/${name}.sol`, "utf8");
  const result = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: { [`${name}.sol`]: { content: source } },
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "cancun",
          outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
      }),
    ),
  );
  const errors = result.errors?.filter(
    (error: { severity: string }) => error.severity === "error",
  );
  if (errors?.length) throw new Error(JSON.stringify(errors));
  const contract = result.contracts[`${name}.sol`][name];
  return {
    abi: contract.abi as Abi,
    bytecode: `0x${contract.evm.bytecode.object}` as Hex,
  };
}
