import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setUnstakeParameters", "Sets unstake parameters to StakeStar")
  .addParam("unstakePeriodLimit", "in blocks")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.setUnstakeParameters(
      args.unstakePeriodLimit
    );
    await tx.wait(3);
    console.log(tx.hash);
    console.log(`Unstake Parameters are set to StakeStar contract`);
  });
