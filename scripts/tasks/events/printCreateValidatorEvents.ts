import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork } from "../../helpers";

task("printCreateValidatorEvents", "Prints CreateValidator events").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const events = await stakeStar.queryFilter(
      stakeStar.filters.CreateValidator()
    );

    for (const event of events) {
      console.log(event.transactionHash);
    }
  }
);
