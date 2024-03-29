import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("upgrade-StakeStar", "Upgrades StakeStar contract").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    await hre.upgrades.upgradeProxy(addresses.stakeStar, StakeStar);
    console.log(`StakeStar is upgraded at ${addresses.stakeStar}`);
  }
);
