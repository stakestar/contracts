import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task(
  "upgrade-StakeStarProvider",
  "Upgrades StakeStarProvider contract"
).setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStarProvider = await hre.ethers.getContractFactory(
    "StakeStarProvider"
  );
  await hre.upgrades.upgradeProxy(
    addresses.stakeStarProvider,
    StakeStarProvider
  );
  console.log(
    `StakeStarProvider is upgraded at ${addresses.stakeStarProvider}`
  );
});
