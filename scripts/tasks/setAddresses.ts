import { task } from "hardhat/config";
import { ADDRESSES, ZERO_ADDRESS } from "../constants";
import { currentNetwork } from "../helpers";

task("setAddresses", "Sets all addresses").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(addresses.stakeStar);

  await stakeStar.setAddresses(
    addresses.depositContract,
    addresses.ssvNetwork,
    addresses.ssvToken,
    ZERO_ADDRESS,
    addresses.stakeStarRegistry,
    addresses.stakeStarETH,
    addresses.stakeStarRewards,
    addresses.stakeStarTreasury
  );

  console.log(`Addresses are set to StakeStar contract`);
});
