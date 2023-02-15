import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setTreasuryRunway", "Sets StakeStarTreasury runway")
  .addParam("minRunway", "number of blocks")
  .addParam("maxRunway", "number of blocks")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarTreasury = await hre.ethers.getContractFactory(
      "StakeStarTreasury"
    );
    const stakeStarTreasury = await StakeStarTreasury.attach(
      addresses.stakeStarTreasury
    );

    const tx = await stakeStarTreasury.setRunway(
      args.minRunway,
      args.maxRunway
    );
    await tx.wait(3);

    console.log(tx.hash);
    console.log("Runway is set to", args.minRunway, "/", args.maxRunway);
  });
