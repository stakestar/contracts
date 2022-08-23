import {ethers, upgrades} from "hardhat";

async function main() {
  const StakeStar = await ethers.getContractFactory("StakeStar");
  const stakeStar = await upgrades.deployProxy(StakeStar);
  await stakeStar.deployed();

  console.log(`StakeStar is deployed to ${stakeStar.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
