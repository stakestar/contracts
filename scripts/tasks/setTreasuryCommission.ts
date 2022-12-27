import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setTreasuryCommission", "Sets StakeStarTreasury commission")
  .addParam("numerator", "from 0 to 100_000")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStarTreasury = await hre.ethers.getContractFactory(
      "StakeStarTreasury"
    );
    const stakeStarTreasury = await StakeStarTreasury.attach(
      addresses.stakeStarTreasury
    );

    const tx = await stakeStarTreasury.setCommission(args.numerator);
    await tx.wait(3);

    console.log(tx.hash);
    console.log("Commission is set to", args.numerator);
  });
