import { task } from "hardhat/config";
import { ADDRESSES, ConstantsLib } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function grantAllManagerRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarAddress: string,
  stakeStarRegistryAddress: string,
  stakeStarTreasuryAddress: string,
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

  const StakeStarTreasury = await hre.ethers.getContractFactory(
    "StakeStarTreasury"
  );
  const stakeStarTreasury = await StakeStarTreasury.attach(
    stakeStarTreasuryAddress
  );

  let tx;

  tx = await stakeStar.grantRole(ConstantsLib.MANAGER_ROLE, managerAddress);
  console.log(tx.hash);
  console.log(`StakeStar::MANAGER_ROLE is granted to ${managerAddress}`);

  tx = await stakeStarRegistry.grantRole(
    ConstantsLib.MANAGER_ROLE,
    managerAddress
  );
  console.log(tx.hash);
  console.log(
    `StakeStarRegistry::MANAGER_ROLE is granted to ${managerAddress}`
  );

  tx = await stakeStarTreasury.grantRole(
    ConstantsLib.MANAGER_ROLE,
    managerAddress
  );
  console.log(tx.hash);
  console.log(
    `StakeStarTreasury::MANAGER_ROLE is granted to ${managerAddress}`
  );
}

task("grant-ManagerRole", "Grants a MANAGER_ROLE to the manager").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];
    await grantAllManagerRoles(
      hre,
      addresses.stakeStar,
      addresses.stakeStarRegistry,
      addresses.stakeStarTreasury,
      addresses.stakeStarBot
    );
  }
);
