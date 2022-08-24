import {ethers, upgrades} from "hardhat";
import {addressesFor} from "./utils/addresses";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const addresses = addressesFor(chainId);

  const StakeStar = await ethers.getContractFactory("StakeStar");
  const stakeStar = await upgrades.deployProxy(StakeStar, [addresses.depositContract, addresses.ssvNetwork, addresses.ssvToken]);
  await stakeStar.deployed();

  console.log(`StakeStar is deployed to ${stakeStar.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
