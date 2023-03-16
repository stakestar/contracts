import {task} from "hardhat/config";
import {ADDRESSES} from "../../constants";
import {currentNetwork, humanify} from "../../helpers";

task("printSavedEvents", "Prints Saved events").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStarOracle = await hre.ethers.getContractFactory(
    "StakeStarOracle"
  );
  const stakeStarOracle = await StakeStarOracle.attach(
    addresses.stakeStarOracle
  );

  const events = await stakeStarOracle.queryFilter(
    stakeStarOracle.filters.Saved()
  );

  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toISOString(),
      event.args.epoch,
      humanify(event.args.totalBalance)
    );
  }
});
