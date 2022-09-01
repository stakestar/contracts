import {ethers, upgrades} from "hardhat";
import {addressesFor} from "./utils/addresses";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const addresses = addressesFor(chainId);

  const StakeStarRegistry = await ethers.getContractFactory("StakeStarRegistry");
  const stakeStarRegistry = await upgrades.deployProxy(StakeStarRegistry);
  await stakeStarRegistry.deployed();
  console.log(`StakeStarRegistry is deployed to ${stakeStarRegistry.address}`);

  const StakeStar = await ethers.getContractFactory("StakeStar");
  const stakeStar = await upgrades.deployProxy(StakeStar, [
    stakeStarRegistry.address,
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken
  ]);
  await stakeStar.deployed();
  console.log(`StakeStar is deployed to ${stakeStar.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
