import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setAddresses", "Sets all addresses").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(addresses.stakeStar);

  const StakeStarTreasury = await hre.ethers.getContractFactory(
    "StakeStarTreasury"
  );
  const stakeStarTreasury = await StakeStarTreasury.attach(
    addresses.stakeStarTreasury
  );

  const UniswapV3Provider = await hre.ethers.getContractFactory(
    "UniswapV3Provider"
  );
  const uniswapV3Provider = await UniswapV3Provider.attach(
    addresses.uniswapV3Provider
  );

  await stakeStar.setAddresses(
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken,
    addresses.oracleNetwork,
    addresses.stakeStarETH,
    addresses.stakeStarRegistry,
    addresses.stakeStarTreasury,
    addresses.withdrawalAddress,
    addresses.feeRecipient,
    addresses.mevRecipient
  );
  console.log(`Addresses are set to StakeStar contract`);

  await stakeStarTreasury.setAddresses(
    addresses.stakeStar,
    addresses.stakeStarETH,
    addresses.ssvNetwork,
    addresses.ssvToken,
    addresses.swapProvider
  );
  console.log(`Addresses are set to StakeStarTreasury contract`);

  await uniswapV3Provider.setAddresses(
    addresses.swapRouter,
    addresses.quoter,
    addresses.uniswapHelper,
    addresses.weth,
    addresses.ssvToken,
    addresses.pool
  );
  console.log(`Addresses are set to UniswapV3Provider contract`);
});
