import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork } from "../../helpers";

task("printPullEvents", "Prints Pull events").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStarRewards = await hre.ethers.getContractFactory(
    "StakeStarRewards"
  );
  const stakeStarRewards = await StakeStarRewards.attach(
    addresses.stakeStarRewards
  );

  const events = await stakeStarRewards.queryFilter(
    stakeStarRewards.filters.Pull()
  );

  for (const event of events) {
    const timestamp = (await event.getBlock()).timestamp;
    console.log(
      timestamp,
      new Date(timestamp * 1000).toISOString(),
      event.args.amount.toString()
    );
  }
});
