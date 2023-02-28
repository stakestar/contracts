import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { currentNetwork } from "../helpers";
import { ADDRESSES, EPOCHS } from "../constants";
import { grantAllStakeStarRoles } from "./grant-StakeStarRole";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];
  const zeroEpochTimestamp = EPOCHS[network];

  const UniswapV3Provider = await hre.ethers.getContractFactory(
    "UniswapV3Provider"
  );
  const uniswapV3Provider = await hre.upgrades.deployProxy(UniswapV3Provider);
  await uniswapV3Provider.deployed();
  console.log(`UniswapV3Provider is deployed to ${uniswapV3Provider.address}`);

  const TWAP = await hre.ethers.getContractFactory("TWAP");
  const twap = await TWAP.deploy();
  await twap.deployed();
  console.log(`TWAP is deployed to ${twap.address}`);

  const StakeStarOracle = await hre.ethers.getContractFactory(
    "StakeStarOracle"
  );
  const stakeStarOracle = await hre.upgrades.deployProxy(StakeStarOracle, [
    zeroEpochTimestamp,
  ]);
  await stakeStarOracle.deployed();
  console.log(`StakeStarOracle is deployed to ${stakeStarOracle.address}`);

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

  const FeeRecipient = await hre.ethers.getContractFactory("FeeRecipient");
  const feeRecipient = await FeeRecipient.deploy();
  await feeRecipient.deployed();
  console.log(`FeeRecipient is deployed to ${feeRecipient.address}`);

  const WithdrawalAddress = await hre.ethers.getContractFactory(
    "WithdrawalAddress"
  );
  const withdrawalAddress = await WithdrawalAddress.deploy();
  await withdrawalAddress.deployed();
  console.log(`WithdrawalAddress is deployed to ${withdrawalAddress.address}`);

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
    stakeStarOracle.address,
    stakeStarETH.address,
    stakeStarRegistry.address,
    stakeStarTreasury.address,
    feeRecipient.address,
    withdrawalAddress.address
  );

  await stakeStarTreasury.setAddresses(
    stakeStar.address,
    addresses.ssvNetwork,
    addresses.ssvToken,
    uniswapV3Provider.address
  );

  await uniswapV3Provider.setAddresses(
    addresses.swapRouter,
    addresses.quoter,
    twap.address,
    addresses.weth,
    addresses.ssvToken,
    addresses.pool
  );

  await grantAllStakeStarRoles(
    hre,
    stakeStar.address,
    stakeStarETH.address,
    stakeStarRegistry.address,
    feeRecipient.address,
    withdrawalAddress.address
  );

  return {
    stakeStar,
    stakeStarRegistry,
    stakeStarETH,
    stakeStarTreasury,
    stakeStarOracle,
    uniswapV3Provider,
    twap,
    withdrawalAddress,
    feeRecipient,
  };
}

task("deployAll", "Deploys all StakeStar contracts").setAction(
  async (args, hre) => {
    await deployAll(hre);
  }
);
