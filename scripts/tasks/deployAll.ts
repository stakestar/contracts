import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { currentNetwork } from "../helpers";
import { ADDRESSES, EPOCHS } from "../constants";
import { grantAllStakeStarRoles } from "./grant-StakeStarRole";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];
  const zeroEpochTimestamp = EPOCHS[network];

  const TWAP = await hre.ethers.getContractFactory("TWAP");
  const twap = await TWAP.deploy();
  await twap.deployed();
  console.log(`TWAP is deployed to ${twap.address}`);

  const StakeStarProvider = await hre.ethers.getContractFactory(
    "StakeStarProvider"
  );
  const stakeStarProvider = await hre.upgrades.deployProxy(StakeStarProvider, [
    zeroEpochTimestamp,
  ]);
  await stakeStarProvider.deployed();
  console.log(`StakeStarProvider is deployed to ${stakeStarProvider.address}`);

  const ChainlinkProvider = await hre.ethers.getContractFactory(
    "ChainlinkProvider"
  );
  const chainlinkProvider = await hre.upgrades.deployProxy(ChainlinkProvider, [
    zeroEpochTimestamp,
  ]);
  await chainlinkProvider.deployed();
  console.log(`ChainlinkProvider is deployed to ${chainlinkProvider.address}`);

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
    stakeStarProvider.address,
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
    stakeStarProvider,
    chainlinkProvider,
    twap,
  };
}

task("deployAll", "Deploys all StakeStar contracts").setAction(
  async (args, hre) => {
    await deployAll(hre);
  }
);
