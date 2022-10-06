import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task(
  "upgrade-StakeStarRegistry",
  "Upgrades StakeStarRegistry contract"
).setAction(async (args, hre) => {
  const network = currentNetwork(require("hardhat"));
  const addresses = ADDRESSES[network];
  console.log(`Network: ${network}`);

  const StakeStarRegistry = await hre.ethers.getContractFactory(
    "StakeStarRegistry"
  );
  await hre.upgrades.upgradeProxy(
    addresses.stakeStarRegistry,
    StakeStarRegistry
  );
  console.log(
    `StakeStarRegistry is upgraded at ${addresses.stakeStarRegistry}`
  );
});
