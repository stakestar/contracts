import { task } from "hardhat/config";
import { ADDRESSES, currentNetwork } from "../utils";

task("grant-ManagerRole", "Grants a MANAGER_ROLE to an address")
  .addPositionalParam("address")
  .setAction(async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];
    console.log(`Network: ${network}`);

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    await stakeStar.grantRole(await stakeStar.MANAGER_ROLE(), args.address);
    console.log(`MANAGER_ROLE is granted to ${args.address}`);
  });
