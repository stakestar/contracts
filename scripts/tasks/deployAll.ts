import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { currentNetwork } from "../helpers";
import { ADDRESSES, EPOCHS } from "../constants";
import { grantAllStakeStarRoles } from "./grant-StakeStarRole";
import { grantAllTreasuryRoles } from "./grant-TreasuryRole";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];
  const zeroEpochTimestamp = EPOCHS[network];

  const StakeStarRegistry = await hre.ethers.getContractFactory(
    "StakeStarRegistry"
  );
  const stakeStarRegistryProxy = await hre.upgrades.deployProxy(
    StakeStarRegistry
  );
  await stakeStarRegistryProxy.deployed();
  const stakeStarRegistry = await StakeStarRegistry.attach(
    stakeStarRegistryProxy.address
  );
  console.log(`StakeStarRegistry is deployed to ${stakeStarRegistry.address}`);

  const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
  const stakeStarETH = await StakeStarETH.deploy();
  await stakeStarETH.deployed();
  console.log(`StakeStarETH is deployed to ${stakeStarETH.address}`);

  const StakeStarTreasury = await hre.ethers.getContractFactory(
    "StakeStarTreasury"
  );
  const stakeStarTreasuryProxy = await hre.upgrades.deployProxy(
    StakeStarTreasury
  );
  await stakeStarTreasuryProxy.deployed();
  const stakeStarTreasury = await StakeStarTreasury.attach(
    stakeStarTreasuryProxy.address
  );
  console.log(`StakeStarTreasury is deployed to ${stakeStarTreasury.address}`);

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStarProxy = await hre.upgrades.deployProxy(StakeStar);
  await stakeStarProxy.deployed();
  const stakeStar = await StakeStar.attach(stakeStarProxy.address);
  console.log(`StakeStar is deployed to ${stakeStar.address}`);

  const UniswapV3Provider = await hre.ethers.getContractFactory(
    "UniswapV3Provider"
  );
  const uniswapV3ProviderProxy = await hre.upgrades.deployProxy(
    UniswapV3Provider
  );
  await uniswapV3ProviderProxy.deployed();
  const uniswapV3Provider = await UniswapV3Provider.attach(
    uniswapV3ProviderProxy.address
  );
  console.log(`UniswapV3Provider is deployed to ${uniswapV3Provider.address}`);

  const UniswapHelper = await hre.ethers.getContractFactory("UniswapHelper");
  const uniswapHelper = await UniswapHelper.deploy();
  await uniswapHelper.deployed();
  console.log(`UniswapHelper is deployed to ${uniswapHelper.address}`);

  const StakeStarOracle = await hre.ethers.getContractFactory(
    "StakeStarOracle"
  );
  const stakeStarOracleProxy = await hre.upgrades.deployProxy(StakeStarOracle, [
    zeroEpochTimestamp,
  ]);
  await stakeStarOracleProxy.deployed();
  const stakeStarOracle = await StakeStarOracle.attach(
    stakeStarOracleProxy.address
  );
  console.log(`StakeStarOracle is deployed to ${stakeStarOracle.address}`);

  const ETHReceiver = await hre.ethers.getContractFactory("ETHReceiver");
  const withdrawalAddress = await ETHReceiver.deploy();
  await withdrawalAddress.deployed();
  console.log(`WithdrawalAddress is deployed to ${withdrawalAddress.address}`);
  const feeRecipient = await ETHReceiver.deploy();
  await feeRecipient.deployed();
  console.log(`FeeRecipient is deployed to ${feeRecipient.address}`);
  const mevRecipient = await ETHReceiver.deploy();
  await mevRecipient.deployed();
  console.log(`MevRecipient is deployed to ${mevRecipient.address}`);

  await stakeStar.setAddresses(
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken,
    stakeStarOracle.address,
    stakeStarETH.address,
    stakeStarRegistry.address,
    stakeStarTreasury.address,
    withdrawalAddress.address,
    feeRecipient.address,
    mevRecipient.address
  );

  await stakeStarTreasury.setAddresses(
    stakeStar.address,
    stakeStarETH.address,
    addresses.ssvNetwork,
    addresses.ssvToken,
    uniswapV3Provider.address
  );

  await uniswapV3Provider.setAddresses(
    addresses.swapRouter,
    addresses.quoter,
    uniswapHelper.address,
    addresses.weth,
    addresses.ssvToken,
    addresses.pool
  );

  await grantAllStakeStarRoles(
    hre,
    stakeStar.address,
    stakeStarETH.address,
    stakeStarRegistry.address,
    withdrawalAddress.address,
    feeRecipient.address,
    mevRecipient.address
  );

  await grantAllTreasuryRoles(
    hre,
    uniswapV3Provider.address,
    stakeStarTreasury.address
  );

  return {
    stakeStar,
    stakeStarRegistry,
    stakeStarETH,
    stakeStarTreasury,
    stakeStarOracle,
    withdrawalAddress,
    feeRecipient,
    mevRecipient,
    uniswapV3Provider,
    uniswapHelper,
  };
}

task("deployAll", "Deploys all StakeStar contracts").setAction(
  async (args, hre) => {
    await deployAll(hre);
  }
);
