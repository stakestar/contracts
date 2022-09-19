import {ethers, upgrades} from "hardhat";
import {addressesFor} from "./utils/constants";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const addresses = addressesFor(chainId);

  const StakeStarRegistry = await ethers.getContractFactory("StakeStarRegistry");
  const stakeStarRegistry = await upgrades.deployProxy(StakeStarRegistry);
  await stakeStarRegistry.deployed();
  console.log(`StakeStarRegistry is deployed to ${stakeStarRegistry.address}`);

  const StakeStar = await ethers.getContractFactory("StakeStar");
  const stakeStar = await upgrades.deployProxy(StakeStar, [
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken,
    stakeStarRegistry.address,
  ]);
  await stakeStar.deployed();
  console.log(`StakeStar is deployed to ${stakeStar.address}`);

  await stakeStarRegistry.grantRole(await stakeStarRegistry.STAKE_STAR_ROLE(), stakeStar.address);
  console.log(`STAKE_STAR_ROLE is granted to StakeStar contract`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
