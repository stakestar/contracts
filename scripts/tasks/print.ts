import { task } from "hardhat/config";
import { ADDRESSES } from "../utils";
import { currentNetwork } from "../helpers";

task("print", "Prints useful metadata from the contracts").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];
    console.log(`Network: ${network}`);

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    console.log("StakeStarRegistry", await stakeStar.stakeStarRegistry());
    console.log("StakeStarETH", await stakeStar.stakeStarETH());
    console.log("StakeStarRewards", await stakeStar.stakeStarRewards());

    console.log("DepositContract", await stakeStar.depositContract());
    console.log("SSV Network", await stakeStar.ssvNetwork());
    console.log("SSV Token", await stakeStar.ssvToken());
  }
);
