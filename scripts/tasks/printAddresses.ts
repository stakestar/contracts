import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("printAddresses", "Prints addresses of the contracts").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    console.log("StakeStar", stakeStar.address);
    console.log("sstarETH", await stakeStar.sstarETH());
    console.log("starETH", await stakeStar.starETH());
    console.log("StakeStarRegistry", await stakeStar.stakeStarRegistry());
    console.log("StakeStarTreasury", await stakeStar.stakeStarTreasury());

    console.log("WithdrawalAddress", await stakeStar.withdrawalAddress());
    console.log("FeeRecipient", await stakeStar.feeRecipient());
    console.log("MevRecipient", await stakeStar.mevRecipient());

    console.log("DepositContract", await stakeStar.depositContract());
    console.log("SSV Network", await stakeStar.ssvNetwork());
    console.log("SSV Token", await stakeStar.ssvToken());
    console.log("OracleNetwork", await stakeStar.oracleNetwork());
  }
);
