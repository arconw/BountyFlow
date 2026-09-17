import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  ["node_modules/hardhat/dist/src/cli.js", "node", "--hostname", "127.0.0.1"],
  { stdio: ["ignore", "ignore", "inherit"] },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
process.stdout.write(
  "Local EVM starting at http://127.0.0.1:8545. Account credentials are not logged.\n",
);
