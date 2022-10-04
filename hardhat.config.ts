import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";
import { ZERO_PRIVATE_KEY } from "./scripts/utils";
import "./scripts/tasks/grant-ManagerRole";
import "./scripts/tasks/print";

const HARDHAT_NETWORK = "http://127.0.0.1:8545/";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 5,
      forking: {
        url: process.env.GOERLI_RPC || HARDHAT_NETWORK,
      },
    },
    goerli: {
      url: process.env.GOERLI_RPC || HARDHAT_NETWORK,
      accounts: [process.env.GOERLI_DEPLOYER_PRIVKEY || ZERO_PRIVATE_KEY],
    },
    tenderly: {
      url: process.env.TENDERLY_RPC || HARDHAT_NETWORK,
      accounts: [process.env.TENDERLY_DEPLOYER_PRIVKEY || ZERO_PRIVATE_KEY],
    },
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};

export default config;
