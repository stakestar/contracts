import { task } from "hardhat/config";
import { ADDRESSES } from "../../constants";
import { currentNetwork, humanify } from "../../helpers";

task("printRateEvents", "Prints Rate events").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(addresses.stakeStar);

  const StakeStarOracleStrict = await hre.ethers.getContractFactory(
    "StakeStarOracleStrict"
  );
  const stakeStarOracleStrict = await StakeStarOracleStrict.attach(
    addresses.stakeStarOracleStrict
  );

  let events;

  console.log("ExtractCommission [timestamp, ssETH]");
  events = await stakeStar.queryFilter(stakeStar.filters.ExtractCommission());
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.ssETH, 18, 10)
    );
  }
  console.log();

  console.log("RateEC [timestamp, rateEC]");
  events = await stakeStar.queryFilter(stakeStar.filters.RateEC());
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.rateEC, 18, 10)
    );
  }
  console.log();

  console.log(
    "CommitSnapshot [block timestamp, timestamp, total_ETH, total_sstarETH, rate]"
  );
  events = await stakeStar.queryFilter(stakeStar.filters.CommitSnapshot());
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      new Date(event.args.timestamp.toNumber() * 1000).toUTCString(),
      humanify(event.args.total_ETH),
      humanify(event.args.total_sstarETH),
      humanify(event.args.rate)
    );
  }
  console.log();

  console.log("Proposed [timestamp, epoch, balance]");
  events = await stakeStarOracleStrict.queryFilter(
    stakeStarOracleStrict.filters.Proposed()
  );
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      event.args.epoch,
      humanify(event.args.totalBalance)
    );
  }
  console.log();

  console.log("Saved [timestamp, epoch, balance]");
  events = await stakeStarOracleStrict.queryFilter(
    stakeStarOracleStrict.filters.Saved()
  );
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      event.args.epoch,
      humanify(event.args.totalBalance)
    );
  }
  console.log();

  console.log("Stake [timestamp, starETH, sstarETH]");
  events = await stakeStar.queryFilter(stakeStar.filters.Stake());
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.starETH),
      humanify(event.args.sstarETH)
    );
  }
  console.log();

  console.log("Unstake [timestamp, sstarETH, starETH]");
  events = await stakeStar.queryFilter(stakeStar.filters.Unstake());
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.sstarETH),
      humanify(event.args.starETH)
    );
  }
  console.log();

  console.log("RateDiff [timestamp, realRate, calculatedRate]");
  events = await stakeStar.queryFilter(stakeStar.filters.RateDiff());
  for (const event of events) {
    console.log(
      new Date((await event.getBlock()).timestamp * 1000).toUTCString(),
      humanify(event.args.realRate),
      humanify(event.args.calculatedRate)
    );
  }
  console.log();
});
