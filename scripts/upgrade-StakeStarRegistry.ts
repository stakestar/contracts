import { ethers, upgrades } from "hardhat";
import { addressesFor, currentEnvironment } from "./utils";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const addresses = addressesFor(chainId, currentEnvironment());

  const StakeStarRegistry = await ethers.getContractFactory(
    "StakeStarRegistry"
  );
  await upgrades.upgradeProxy(addresses.stakeStarRegistry, StakeStarRegistry);
  console.log(
    `StakeStarRegistry is upgraded at ${addresses.stakeStarRegistry}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
