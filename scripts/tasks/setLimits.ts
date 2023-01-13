import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setLimits", "Sets StakeStarProvider validation limits")
  .addParam(
    "avgValidatorBalanceLowerLimit",
    "value in wei(18 decimals), for example 1000000000000000000"
  )
  .addParam(
    "avgValidatorBalanceUpperLimit",
    "value in wei(18 decimals), for example 1000000000000000000"
  )
  .addParam("epochGapLimit", "value in seconds")
  .addParam(
    "aprLimit",
    "value in wei(18 decimals), for example 1000000000000000000"
  )
  .addParam("validatorCountDiffLimit")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarProvider = await hre.ethers.getContractFactory(
      "StakeStarProvider"
    );
    const stakeStarProvider = await StakeStarProvider.attach(
      addresses.stakeStarProvider
    );

    await stakeStarProvider.setLimits(
      args.avgValidatorBalanceLowerLimit,
      args.avgValidatorBalanceUpperLimit,
      args.epochGapLimit,
      args.aprLimit,
      args.validatorCountDiffLimit
    );

    console.log(`Limits are set to StakeStarProvider contract`);
  });
