import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import "dotenv/config";
import {ZERO_PRIVKEY} from "./scripts/utils/constants";

const HARDHAT_NETWORK = 'http://127.0.0.1:8545/';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 5,
      forking: {
        url: process.env.INFURA_GOERLI_RPC || HARDHAT_NETWORK
      }
    },
    goerli: {
      url: process.env.INFURA_GOERLI_RPC || HARDHAT_NETWORK,
      accounts: [process.env.GOERLI_DEPLOYER_PRIVKEY || ZERO_PRIVKEY]
    }
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      },
    },
  }
};

export default config;
