import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { currentNetwork } from "../helpers";
import { EPOCHS } from "../constants";
import { grantAllStakeStarRoles } from "./grant-StakeStarRole";
import { grantAllTreasuryRoles } from "./grant-TreasuryRole";
import { setAllAddresses } from "./setAllAddresses";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const network = currentNetwork(hre);
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

  const SStarETH = await hre.ethers.getContractFactory("SStarETH");
  const sstarETH = await SStarETH.deploy();
  await sstarETH.deployed();
  console.log(`SStarETH is deployed to ${sstarETH.address}`);

  const StarETH = await hre.ethers.getContractFactory("StarETH");
  const starETH = await StarETH.deploy();
  await starETH.deployed();
  console.log(`StarETH is deployed to ${starETH.address}`);

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

  const StakeStarOracleStrict = await hre.ethers.getContractFactory(
    "StakeStarOracleStrict"
  );
  const stakeStarOracleStrictProxy = await hre.upgrades.deployProxy(
    StakeStarOracleStrict,
    [zeroEpochTimestamp]
  );
  await stakeStarOracleStrictProxy.deployed();
  const stakeStarOracleStrict = await StakeStarOracleStrict.attach(
    stakeStarOracleStrictProxy.address
  );
  console.log(
    `StakeStarOracleStrict is deployed to ${stakeStarOracleStrict.address}`
  );

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

  await setAllAddresses(
    hre,
    stakeStar.address,
    sstarETH.address,
    starETH.address,
    stakeStarOracle.address,
    stakeStarRegistry.address,
    stakeStarTreasury.address,
    withdrawalAddress.address,
    feeRecipient.address,
    mevRecipient.address,
    uniswapV3Provider.address,
    uniswapHelper.address
  );

  await grantAllStakeStarRoles(
    hre,
    stakeStar.address,
    sstarETH.address,
    starETH.address,
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
    sstarETH,
    starETH,
    stakeStarTreasury,
    stakeStarOracle,
    stakeStarOracleStrict,
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
