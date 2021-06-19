import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import "@nomiclabs/hardhat-waffle";

// This adds support for TS path mappings
import "tsconfig-paths/register";

import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: "0.7.4",
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL,
        blockNumber: Number(process.env.BLOCK_NUMBER),
      },
    },
  },
};

export default config;
