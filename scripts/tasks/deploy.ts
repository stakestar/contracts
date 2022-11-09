import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("deploy", "Deploys all StakeStar contracts").setAction(
  async (args, hre) => {
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

    const StakeStarTreasury = await hre.ethers.getContractFactory(
      "StakeStarTreasury"
    );
    const stakeStarTreasury = await hre.upgrades.deployProxy(StakeStarTreasury);
    await stakeStarTreasury.deployed();
    console.log(
      `StakeStarTreasury is deployed to ${stakeStarTreasury.address}`
    );

    const StakeStarRegistry = await hre.ethers.getContractFactory(
      "StakeStarRegistry"
    );
    const stakeStarRegistry = await hre.upgrades.deployProxy(StakeStarRegistry);
    await stakeStarRegistry.deployed();
    console.log(
      `StakeStarRegistry is deployed to ${stakeStarRegistry.address}`
    );

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await hre.upgrades.deployProxy(StakeStar, [
      addresses.depositContract,
      addresses.ssvNetwork,
      addresses.ssvToken,
      stakeStarRegistry.address,
      stakeStarTreasury.address,
    ]);
    await stakeStar.deployed();
    console.log(`StakeStar is deployed to ${stakeStar.address}`);

    await stakeStarRegistry.grantRole(
      await stakeStarRegistry.STAKE_STAR_ROLE(),
      stakeStar.address
    );
    console.log(`STAKE_STAR_ROLE is granted to StakeStar contract`);

    await stakeStar.grantRole(
      await stakeStar.MANAGER_ROLE(),
      addresses.stakeStarBot
    );
    console.log(
      `MANAGER_ROLE is granted to StakeStarBot ${addresses.stakeStarBot}`
    );
  }
);
