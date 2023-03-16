import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork, humanify } from "../../helpers";

task("printRateEvents", "Prints Rate events").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(addresses.stakeStar);

  console.log("ExtractCommission [timestamp, ssETH]");
  const events1 = await stakeStar.queryFilter(
    stakeStar.filters.ExtractCommission()
  );
  for (const event of events1) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.ssETH)
    );
  }
  console.log();

  console.log("CommitSnapshot [timestamp, total_ETH, total_sstarETH, rate]");
  const events2 = await stakeStar.queryFilter(
    stakeStar.filters.CommitSnapshot()
  );
  for (const event of events2) {
    console.log(
      new Date(event.args.timestamp.toNumber() * 1000).toUTCString(),
      humanify(event.args.total_ETH),
      humanify(event.args.total_sstarETH),
      humanify(event.args.rate)
    );
  }
  console.log();

  console.log("Stake [timestamp, starETH, sstarETH]");
  const events3 = await stakeStar.queryFilter(stakeStar.filters.Stake());
  for (const event of events3) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.starETH),
      humanify(event.args.sstarETH)
    );
  }
  console.log();

  console.log("Unstake [timestamp, sstarETH, starETH]");
  const events4 = await stakeStar.queryFilter(stakeStar.filters.Unstake());
  for (const event of events4) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.sstarETH),
      humanify(event.args.starETH)
    );
  }
  console.log();

  console.log("RateDiff [timestamp, realRate, calculatedRate]");
  const events5 = await stakeStar.queryFilter(stakeStar.filters.RateDiff());
  for (const event of events5) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.realRate),
      humanify(event.args.calculatedRate)
    );
  }
  console.log();
});
