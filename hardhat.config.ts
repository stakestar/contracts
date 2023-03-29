import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

import { ZERO_PRIVATE_KEY } from "./scripts/constants";
import { Network } from "./scripts/types";

import "./scripts/tasks/events/printCreateValidatorEvents";
import "./scripts/tasks/events/printPullEvents";
import "./scripts/tasks/events/printRateEvents";
import "./scripts/tasks/events/printSavedEvents";
import "./scripts/tasks/events/printValidatorEvents";
import "./scripts/tasks/allowListOperators";
import "./scripts/tasks/commitSnapshot";
import "./scripts/tasks/deployAll";
import "./scripts/tasks/grant-ManagerRole";
import "./scripts/tasks/grant-OracleRole";
import "./scripts/tasks/grant-StakeStarRole";
import "./scripts/tasks/grant-TreasuryRole";
import "./scripts/tasks/printAddresses";
import "./scripts/tasks/printContractVariables";
import "./scripts/tasks/reactivateAccount";
import "./scripts/tasks/setAllAddresses";
import "./scripts/tasks/setEpochUpdatePeriod";
import "./scripts/tasks/setLocalPoolParameters";
import "./scripts/tasks/setRateParameters";
import "./scripts/tasks/setSwapParameters";
import "./scripts/tasks/setTreasuryCommission";
import "./scripts/tasks/setTreasuryRunway";
import "./scripts/tasks/setValidatorWithdrawalThreshold";
import "./scripts/tasks/upgrade-StakeStar";
import "./scripts/tasks/upgrade-StakeStarOracle";
import "./scripts/tasks/upgrade-StakeStarOracleStrict";
import "./scripts/tasks/upgrade-StakeStarRegistry";
import "./scripts/tasks/upgrade-StakeStarTreasury";

const HARDHAT_NETWORK = "http://127.0.0.1:8545/";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    [Network.HARDHAT]: {
      forking: {
        url: process.env.GOERLI_RPC || HARDHAT_NETWORK,
        blockNumber: 8059292,
      },
    },
    [Network.GOERLI]: {
      url: process.env.GOERLI_RPC || HARDHAT_NETWORK,
      accounts: [process.env.GOERLI_DEPLOYER_PRIVKEY || ZERO_PRIVATE_KEY],
      timeout: 3000000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.GAS_REPORTER === "true",
  },
};

export default config;
