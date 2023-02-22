import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("reactivateAccount", "Reactivates account in SSV network").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.reactivateAccount();
    await tx.wait(3);

    console.log(tx.hash);
    console.log("Account has been reactivated");
  }
);
