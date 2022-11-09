import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function grantAllStakeStarRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarAddress: string,
  stakeStarRegistryAddress: string,
  stakeStarETHAddress: string,
  stakeStarRewardsAddress: string
) {
  const StakeStarRegistry = await hre.ethers.getContractFactory(
    "StakeStarRegistry"
  );
  const stakeStarRegistry = await StakeStarRegistry.attach(
    stakeStarRegistryAddress
  );

  const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
  const stakeStarETH = await StakeStarETH.attach(stakeStarETHAddress);

  const StakeStarRewards = await hre.ethers.getContractFactory(
    "StakeStarRewards"
  );
  const stakeStarRewards = await StakeStarRewards.attach(
    stakeStarRewardsAddress
  );

  await stakeStarRegistry.grantRole(
    await stakeStarRegistry.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(
    `StakeStarRegistry.STAKE_STAR_ROLE is granted to StakeStar contract`
  );
  await stakeStarETH.grantRole(
    await stakeStarETH.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(`StakeStarETH.STAKE_STAR_ROLE is granted to StakeStar contract`);
  await stakeStarRewards.grantRole(
    await stakeStarRewards.STAKE_STAR_ROLE(),
    stakeStarAddress
  );
  console.log(
    `StakeStarRewards.STAKE_STAR_ROLE is granted to StakeStar contract`
  );
}

task(
  "grant-StakeStarRole",
  "Grants a STAKE_STAR_ROLE to StakeStar contract"
).setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  await grantAllStakeStarRoles(
    hre,
    addresses.stakeStar,
    addresses.stakeStarRegistry,
    addresses.stakeStarETH,
    addresses.stakeStarRewards
  );
});
