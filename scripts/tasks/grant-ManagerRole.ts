import { task } from "hardhat/config";
import { ADDRESSES, ConstantsLib } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function grantAllManagerRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarAddress: string,
  stakeStarRegistryAddress: string,
  stakeStarOracleAddress: string,
  managerAddress: string
) {
  const StakeStar = await hre.ethers.getContractFactory("StakeStar");
  const stakeStar = await StakeStar.attach(stakeStarAddress);

  const StakeStarRegistry = await hre.ethers.getContractFactory(
    "StakeStarRegistry"
  );
  const stakeStarRegistry = await StakeStarRegistry.attach(
    stakeStarRegistryAddress
  );

  const StakeStarOracle = await hre.ethers.getContractFactory(
    "StakeStarOracle"
  );
  const stakeStarOracle = await StakeStarOracle.attach(stakeStarOracleAddress);

  await stakeStar.grantRole(ConstantsLib.MANAGER_ROLE, managerAddress);
  console.log(`StakeStar::MANAGER_ROLE is granted to ${managerAddress}`);

  await stakeStarRegistry.grantRole(ConstantsLib.MANAGER_ROLE, managerAddress);
  console.log(
    `StakeStarRegistry::MANAGER_ROLE is granted to ${managerAddress}`
  );

  await stakeStarOracle.grantRole(ConstantsLib.MANAGER_ROLE, managerAddress);
  console.log(`StakeStarOracle::MANAGER_ROLE is granted to ${managerAddress}`);
}

task("grant-ManagerRole", "Grants a MANAGER_ROLE to the manager").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];
    await grantAllManagerRoles(
      hre,
      addresses.stakeStar,
      addresses.stakeStarRegistry,
      addresses.stakeStarProvider,
      addresses.stakeStarBot
    );
  }
);
