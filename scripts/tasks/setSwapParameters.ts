import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setSwapParameters", "Sets swap parameters to UniswapV3Provider")
  .addParam("fee", "pool fee")
  .addParam("slippage", "value in (0, 100000], better in [97000, 100000]")
  .addParam("twapInterval", "in seconds, better around 30-60 minutes")
  .addParam("minLiquidity", "required liquidity in the pool in WEI")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const UniswapV3Provider = await hre.ethers.getContractFactory(
      "UniswapV3Provider"
    );
    const uniswapV3Provider = await UniswapV3Provider.attach(
      addresses.uniswapV3Provider
    );

    const tx = await uniswapV3Provider.setParameters(
      args.fee,
      args.slippage,
      args.twapInterval,
      args.minLiquidity
    );
    await tx.wait(3);
    console.log(tx.hash);
    console.log(`Parameters are set to UniswapV3Provider contract`);
  });
