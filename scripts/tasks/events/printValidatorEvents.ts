import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork } from "../../helpers";

task("printValidatorEvents", "Prints Validator events").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarRegistry = await hre.ethers.getContractFactory(
      "StakeStarRegistry"
    );
    const stakeStarRegistry = await StakeStarRegistry.attach(
      addresses.stakeStarRegistry
    );

    let events;

    console.log("ValidatorStatusChange [timestamp, ssETH]");
    events = await stakeStarRegistry.queryFilter(
      stakeStarRegistry.filters["ValidatorStatusChange(bytes,uint8,uint8)"]()
    );
    for (const event of events) {
      console.log(
        new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
        event.transactionHash,
        event.args.statusFrom,
        event.args.statusTo
      );
    }
    console.log();
  }
);
