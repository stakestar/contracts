import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("deploy", "Deploys all StakeStar contracts").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];
    console.log(`Network: ${network}`);

    /* MockRewardsProvider */
    const mockRewardsProviderFactory = await hre.ethers.getContractFactory(
      "MockRewardsProvider"
    );
    const mockRewardsProvider = await hre.upgrades.deployProxy(
      mockRewardsProviderFactory
    );
    await mockRewardsProvider.deployed();
    console.log(
      `MockRewardsProvider is deployed to ${mockRewardsProvider.address}`
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
    ]);
    await stakeStar.deployed();
    console.log(`StakeStar is deployed to ${stakeStar.address}`);

    await stakeStarRegistry.grantRole(
      await stakeStarRegistry.STAKE_STAR_ROLE(),
      stakeStar.address
    );
    console.log(`STAKE_STAR_ROLE is granted to StakeStar contract`);
  }
);
