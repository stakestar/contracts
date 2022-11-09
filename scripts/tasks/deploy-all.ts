import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { currentNetwork } from "../helpers";
import { ADDRESSES } from "../constants";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];
  console.log(`Network: ${network}`);

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

  const StakeStarRewards = await hre.ethers.getContractFactory(
    "StakeStarRewards"
  );
  const stakeStarRewards = await StakeStarRewards.deploy();
  await stakeStarRewards.deployed();

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

  await stakeStarRegistry.grantRole(
    await stakeStarRegistry.STAKE_STAR_ROLE(),
    stakeStar.address
  );
  console.log(
    `StakeStarRegistry.STAKE_STAR_ROLE is granted to StakeStar contract`
  );
  await stakeStarETH.grantRole(
    await stakeStarETH.STAKE_STAR_ROLE(),
    stakeStar.address
  );
  console.log(`StakeStarETH.STAKE_STAR_ROLE is granted to StakeStar contract`);
  await stakeStarRewards.grantRole(
    await stakeStarRewards.STAKE_STAR_ROLE(),
    stakeStar.address
  );
  console.log(
    `StakeStarRewards.STAKE_STAR_ROLE is granted to StakeStar contract`
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

task("deploy-all", "Deploys all StakeStar contracts").setAction(
  async (args, hre) => {
    await deployAll(hre);
  }
);
