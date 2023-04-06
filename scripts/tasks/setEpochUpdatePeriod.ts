import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setEpochUpdatePeriod", "Sets EpochUpdatePeriod for oracles")
  .addParam("period", "period in epochs")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarOracleStrict = await hre.ethers.getContractFactory(
      "StakeStarOracleStrict"
    );
    const stakeStarOracleStrict = await StakeStarOracleStrict.attach(
      addresses.stakeStarOracleStrict
    );

    const tx = await stakeStarOracleStrict.setEpochUpdatePeriod(args.period);
    await tx.wait(3);
    console.log(tx.hash);
    console.log("EpochUpdatePeriod is set to", args.period, "epochs");
  });
