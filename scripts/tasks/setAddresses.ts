import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task("setAddresses", "Grants a MANAGER_ROLE to an address").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    await stakeStar.setAddresses(
      addresses.depositContract,
      addresses.ssvNetwork,
      addresses.ssvToken,
      addresses.stakeStarRegistry,
      addresses.stakeStarETH,
      addresses.stakeStarRewards,
      addresses.stakeStarTreasury
    );

    console.log(`Addresses are set to StakeStar contract`);
  }
);
