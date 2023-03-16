import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setLocalPoolParameters", "Sets local pool parameters to StakeStar")
  .addParam("localPoolMaxSize", "in wei")
  .addParam("localPoolUnstakeLimit", "in wei")
  .addParam("localPoolUnstakeFrequencyLimit", "in number of blocks")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.setLocalPoolParameters(
      args.localPoolMaxSize,
      args.localPoolUnstakeLimit,
      args.localPoolUnstakeFrequencyLimit
    );
    await tx.wait(3);
    console.log(tx.hash);
    console.log(`Local Pool Parameters are set to StakeStar contract`);
  });
