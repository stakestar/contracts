import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("commitSnapshot", "Commits snapshot").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(addresses.stakeStar);

  const tx = await stakeStar.commitSnapshot();
  await tx.wait(3);

  console.log(`Snapshot committed`, tx.hash);
});
