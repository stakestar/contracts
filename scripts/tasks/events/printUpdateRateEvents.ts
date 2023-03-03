import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork, humanify } from "../../helpers";

task("printUpdateRateEvents", "Prints UpdateRate events").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const events = await stakeStar.queryFilter(
      stakeStar.filters.CommitSnapshot()
    );

    for (const event of events) {
      console.log(
        new Date(event.args.timestamp.toNumber() * 1000).toISOString(),
        humanify(event.args.total_ETH),
        humanify(event.args.total_ssETH),
        humanify(event.args.rate)
      );
    }
  }
);
