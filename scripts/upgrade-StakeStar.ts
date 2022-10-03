import { ethers, upgrades } from "hardhat";
import { addressesFor, currentEnvironment } from "./utils";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const addresses = addressesFor(chainId, currentEnvironment());

  const StakeStar = await ethers.getContractFactory("StakeStar");
  await upgrades.upgradeProxy(addresses.stakeStar, StakeStar);
  console.log(`StakeStar is upgraded at ${addresses.stakeStar}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
