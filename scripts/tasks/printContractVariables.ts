import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";
import { BigNumber } from "ethers";

function stringify(n: BigNumber) {
  return n.toString();
}

task("printContractVariables", "Prints contracts variables").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    console.log("StakeStar", stakeStar.address);
    console.log(
      "pendingUnstakeSum",
      stringify(await stakeStar.pendingUnstakeSum())
    );
    console.log("localPoolSize", stringify(await stakeStar.localPoolSize()));
    console.log(
      "stakingSurplusA",
      stringify(await stakeStar.stakingSurplusA())
    );
    console.log("timestampA", stringify(await stakeStar.timestampA()));
    console.log(
      "stakingSurplusB",
      stringify(await stakeStar.stakingSurplusB())
    );
    console.log("timestampB", stringify(await stakeStar.timestampB()));
    console.log(
      "reservedTreasuryCommission",
      stringify(await stakeStar.reservedTreasuryCommission())
    );
    console.log(
      "currentApproximateRate",
      stringify(await stakeStar.currentApproximateRate())
    );
    console.log();

    const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
    const stakeStarETH = await StakeStarETH.attach(addresses.stakeStarETH);

    console.log("rate", stringify(await stakeStarETH.rate()));
    console.log("totalSupply", stringify(await stakeStarETH.totalSupply()));
    console.log(
      "totalSupplyEth",
      stringify(await stakeStarETH.totalSupplyEth())
    );
  }
);
