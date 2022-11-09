import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("deploy-step2", "Step2 of Treasury upgrade").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];
    console.log(`Network: ${network}`);

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
    const stakeStarRegistry = await StakeStarRegistry.attach(
      addresses.stakeStarRegistry
    ).connect((await hre.ethers.getSigners())[0]);

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

    await stakeStarRegistry.revokeRole(
      await stakeStarRegistry.STAKE_STAR_ROLE(),
      addresses.stakeStar
    );
    console.log(`STAKE_STAR_ROLE is revoked from the old StakeStar contract`);

    await stakeStar.grantRole(
      await stakeStar.MANAGER_ROLE(),
      addresses.stakeStarBot
    );
    console.log(
      `MANAGER_ROLE is granted to StakeStarBot ${addresses.stakeStarBot}`
    );
  }
);
