import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setCommissionParameters", "Sets commission parameters to StakeStar")
  .addParam("rateDiffThreshold", "in wei")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.setCommissionParameters(args.rateDiffThreshold);
    await tx.wait(3);
    console.log(tx.hash);
    console.log(`Commission Parameters are set to StakeStar contract`);
  });
