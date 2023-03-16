import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function setAllAddresses(
  hre: HardhatRuntimeEnvironment,
  stakeStarAddress: string,
  stakeStarETHAddress: string,
  stakeStarOracleAddress: string,
  stakeStarRegistryAddress: string,
  stakeStarTreasuryAddress: string,
  withdrawalAddress: string,
  feeRecipientAddress: string,
  mevRecipientAddress: string,
  uniswapV3ProviderAddress: string,
  uniswapHelperAddress: string
) {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(stakeStarAddress);

  const StakeStarTreasury = await hre.ethers.getContractFactory(
    "StakeStarTreasury"
  );
  const stakeStarTreasury = await StakeStarTreasury.attach(
    stakeStarTreasuryAddress
  );

  const UniswapV3Provider = await hre.ethers.getContractFactory(
    "UniswapV3Provider"
  );
  const uniswapV3Provider = await UniswapV3Provider.attach(
    uniswapV3ProviderAddress
  );

  let tx;

  tx = await stakeStar.setAddresses(
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken,
    stakeStarOracleAddress,
    stakeStarETHAddress,
    stakeStarRegistryAddress,
    stakeStarTreasuryAddress,
    withdrawalAddress,
    feeRecipientAddress,
    mevRecipientAddress
  );
  await tx.wait(3);

  console.log(tx.hash);
  console.log(`Addresses are set to StakeStar contract`);

  tx = await stakeStarTreasury.setAddresses(
    stakeStarAddress,
    stakeStarETHAddress,
    addresses.ssvNetwork,
    addresses.ssvToken,
    uniswapV3ProviderAddress
  );
  await tx.wait(3);

  console.log(tx.hash);
  console.log(`Addresses are set to StakeStarTreasury contract`);

  tx = await uniswapV3Provider.setAddresses(
    addresses.swapRouter,
    addresses.quoter,
    uniswapHelperAddress,
    addresses.weth,
    addresses.ssvToken,
    addresses.pool
  );
  await tx.wait(3);

  console.log(tx.hash);
  console.log(`Addresses are set to UniswapV3Provider contract`);
}

task("setAllAddresses", "Sets all addresses").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  await setAllAddresses(
    hre,
    addresses.stakeStar,
    addresses.stakeStarETH,
    addresses.stakeStarOracle,
    addresses.stakeStarRegistry,
    addresses.stakeStarTreasury,
    addresses.withdrawalAddress,
    addresses.feeRecipient,
    addresses.mevRecipient,
    addresses.uniswapV3Provider,
    addresses.uniswapHelper
  );
});
