import { task } from "hardhat/config";
import { addressesFor, currentEnvironment } from "../utils";

task("grant-ManagerRole", "Grants a MANAGER_ROLE to an address")
  .addPositionalParam("address")
  .setAction(async (args, hre) => {
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    const addresses = addressesFor(chainId, currentEnvironment());

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    await stakeStar.grantRole(await stakeStar.MANAGER_ROLE(), args.address);
    console.log(`MANAGER_ROLE is granted to ${args.address}`);
  });
