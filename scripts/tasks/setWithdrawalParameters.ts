import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setWithdrawalParameters", "Sets withdrawal parameters to StakeStar")
  .addParam("withdrawalMinLimit", "in ether")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.setWithdrawalParameters(args.withdrawalMinLimit);
    await tx.wait(3);
    console.log(tx.hash);
    console.log(`Withdrawal Parameters are set to StakeStar contract`);
  });
