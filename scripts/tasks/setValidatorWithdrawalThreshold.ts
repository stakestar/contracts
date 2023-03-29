import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork, humanify } from "../helpers";
import {BigNumber} from "ethers";

task("setValidatorWithdrawalThreshold", "Sets rate parameters to StakeStar")
  .addParam("threshold", "in wei")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.setValidatorWithdrawalThreshold(args.threshold);
    await tx.wait(3);
    console.log(tx.hash);
    console.log(
      `ValidatorWithdrawalThreshold is set to ${humanify(BigNumber.from(args.threshold))}`
    );
  });
