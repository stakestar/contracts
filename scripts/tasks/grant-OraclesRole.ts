import { task } from "hardhat/config";
import { ADDRESSES, ConstantsLib } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StakeStarOracle } from "../../typechain-types";
import hre from "hardhat";

export async function grantOraclesRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarOracleAdmin: StakeStarOracle,
  oracle1: string,
  oracle2: string,
  oracle3: string,
) {
  await stakeStarOracleAdmin.setOracle(oracle1, 0);
  console.log(
    `StakeStarRegistry::setOracle 0 is granted to ${oracle1}`
  );
  await stakeStarOracleAdmin.setOracle(oracle2, 1);
  console.log(
    `StakeStarRegistry::setOracle 1 is granted to ${oracle2}`
  );
  await stakeStarOracleAdmin.setOracle(oracle3, 2);
  console.log(
    `StakeStarRegistry::setOracle 2 is granted to ${oracle3}`
  );

}

task("grant-OraclesRole", "Set Oracles Roles").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const [owner] = await hre.ethers.getSigners();

    const StakeStarOracle = await hre.ethers.getContractFactory(
      "StakeStarOracle"
    );
    const stakeStarOracle = await StakeStarOracle.attach(addresses.stakeStar);
    const stakeStarOracleAdmin = await stakeStarOracle.connect(owner);

    await grantOraclesRoles(
      hre,
      stakeStarOracleAdmin,
      addresses.oracle1,
      addresses.oracle2,
      addresses.oracle3,
    );
  }
);
