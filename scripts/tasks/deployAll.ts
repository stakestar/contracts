import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { currentNetwork } from "../helpers";
import { ADDRESSES } from "../constants";
import { grantAllStakeStarRoles } from "./grant-StakeStarRole";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const MockRewardsProvider = await hre.ethers.getContractFactory(
    "MockRewardsProvider"
  );
  const mockRewardsProvider = await MockRewardsProvider.deploy();
  await mockRewardsProvider.deployed();
  console.log(
    `MockRewardsProvider is deployed to ${mockRewardsProvider.address}`
  );

  const StakeStarRegistry = await hre.ethers.getContractFactory(
    "StakeStarRegistry"
  );
  const stakeStarRegistry = await hre.upgrades.deployProxy(StakeStarRegistry);
  await stakeStarRegistry.deployed();
  console.log(`StakeStarRegistry is deployed to ${stakeStarRegistry.address}`);

  const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
  const stakeStarETH = await StakeStarETH.deploy();
  await stakeStarETH.deployed();
  console.log(`StakeStarETH is deployed to ${stakeStarETH.address}`);

  const StakeStarRewards = await hre.ethers.getContractFactory(
    "StakeStarRewards"
  );
  const stakeStarRewards = await StakeStarRewards.deploy();
  await stakeStarRewards.deployed();
  console.log(`StakeStarRewards is deployed to ${stakeStarRewards.address}`);

  const StakeStarTreasury = await hre.ethers.getContractFactory(
    "StakeStarTreasury"
  );
  const stakeStarTreasury = await hre.upgrades.deployProxy(StakeStarTreasury);
  await stakeStarTreasury.deployed();
  console.log(`StakeStarTreasury is deployed to ${stakeStarTreasury.address}`);

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await hre.upgrades.deployProxy(StakeStar);
  await stakeStar.deployed();
  console.log(`StakeStar is deployed to ${stakeStar.address}`);

  await stakeStar.setAddresses(
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken,
    stakeStarRegistry.address,
    stakeStarETH.address,
    stakeStarRewards.address,
    stakeStarTreasury.address
  );

  await grantAllStakeStarRoles(
    hre,
    stakeStar.address,
    stakeStarRegistry.address,
    stakeStarETH.address,
    stakeStarRewards.address
  );

  return {
    stakeStar,
    stakeStarRegistry,
    stakeStarETH,
    stakeStarRewards,
    stakeStarTreasury,
    mockRewardsProvider,
  };
}

task("deployAll", "Deploys all StakeStar contracts").setAction(
  async (args, hre) => {
    await deployAll(hre);
  }
);