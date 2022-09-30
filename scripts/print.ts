import { ethers } from "hardhat";
import { addressesFor, currentEnvironment } from "./utils";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const addresses = addressesFor(chainId, currentEnvironment());

  const StakeStar = await ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(addresses.stakeStar);

  console.log("StakeStarRegistry", await stakeStar.stakeStarRegistry());
  console.log("StakeStarETH", await stakeStar.stakeStarETH());
  console.log("StakeStarRewards", await stakeStar.stakeStarRewards());

  console.log("DepositContract", await stakeStar.depositContract());
  console.log("SSV Network", await stakeStar.ssvNetwork());
  console.log("SSV Token", await stakeStar.ssvToken());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
