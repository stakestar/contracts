import {task} from "hardhat/config";
import {ADDRESSES} from "../constants";
import {currentNetwork} from "../helpers";

task("deposit", "Make a deposit").addParam("value", "in wei").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(addresses.stakeStar);

  const tx = await stakeStar.deposit({value: args.value});
  await tx.wait(3);

  console.log(tx.hash);
  console.log(`Deposited`);
});
