import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork } from "../../helpers";

task("printUpdateRateEvents", "Prints UpdateRate events").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
    const stakeStarETH = await StakeStarETH.attach(addresses.stakeStarETH);

    const events = await stakeStarETH.queryFilter(
      stakeStarETH.filters.UpdateRate()
    );

    for (const event of events) {
      const timestamp = (await event.getBlock()).timestamp;
      console.log(
        timestamp,
        new Date(timestamp * 1000).toISOString(),
        event.args.rate.toString(),
        event.args.ethChange.toString()
      );
    }
  }
);
