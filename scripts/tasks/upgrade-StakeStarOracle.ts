import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("upgrade-StakeStarOracle", "Upgrades StakeStarOracle contract").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarOracle = await hre.ethers.getContractFactory(
      "StakeStarOracle"
    );
    await hre.upgrades.upgradeProxy(addresses.stakeStarOracle, StakeStarOracle);
    console.log(`StakeStarOracle is upgraded at ${addresses.stakeStarOracle}`);
  }
);
