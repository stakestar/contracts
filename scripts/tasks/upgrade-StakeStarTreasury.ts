import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task(
  "upgrade-StakeStarTreasury",
  "Upgrades StakeStarTreasury contract"
).setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStarTreasury = await hre.ethers.getContractFactory(
    "StakeStarTreasury"
  );
  await hre.upgrades.upgradeProxy(
    addresses.stakeStarTreasury,
    StakeStarTreasury
  );
  console.log(
    `StakeStarTreasury is upgraded at ${addresses.stakeStarTreasury}`
  );
});
