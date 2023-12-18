import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setQueueParameters", "Sets queue parameters to StakeStar")
  .addParam("loopLimit", "max iterations in loop")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.setQueueParameters(args.loopLimit);
    await tx.wait(3);
    console.log(tx.hash);
    console.log(`Queue Parameters are set to StakeStar contract`);
  });
