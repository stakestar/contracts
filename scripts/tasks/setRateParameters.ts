import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setRateParameters", "Sets rate parameters to StakeStar")
  .addParam("maxRateDeviation", "[0, 100_000]")
  .addParam("rateDeviationCheck", "true/false")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    if (args.rateDeviationCheck != "true" && args.rateDeviationCheck != "false")
      throw new Error("rateDeviationCheck can be only true or false");

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    const tx = await stakeStar.setRateParameters(
      args.maxRateDeviation,
      args.rateDeviationCheck == "true"
    );
    await tx.wait(3);
    console.log(tx.hash);
    console.log(`Rate Parameters are set to StakeStar contract`);
  });
