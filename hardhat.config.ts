import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: "0.8.37",
  networks: {
    default: { type: "edr-simulated", chainId: 31337, chainType: "l1" },
  },
});
