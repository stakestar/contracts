import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StakeStarOracle } from "../../typechain-types";

export async function grantOracleRoles(
  hre: HardhatRuntimeEnvironment,
  stakeStarOracleAddress: string,
  stakeStarOracleStrictAddress: string,
  oracle1: string,
  oracle2: string,
  oracle3: string
) {
  const StakeStarOracle = await hre.ethers.getContractFactory(
    "StakeStarOracle"
  );
  const stakeStarOracle = await StakeStarOracle.attach(stakeStarOracleAddress);
  const StakeStarOracleStrict = await hre.ethers.getContractFactory(
    "StakeStarOracleStrict"
  );
  const stakeStarOracleStrict = await StakeStarOracleStrict.attach(
    stakeStarOracleStrictAddress
  );

  let tx;

  tx = await stakeStarOracle.setOracle(oracle1, 0);
  await tx.wait(3);
  console.log(tx.hash);
  console.log(`StakeStarOracle::setOracle 0 is granted to ${oracle1}`);
  tx = await stakeStarOracle.setOracle(oracle2, 1);
  await tx.wait(3);
  console.log(tx.hash);
  console.log(`StakeStarOracle::setOracle 1 is granted to ${oracle2}`);
  tx = await stakeStarOracle.setOracle(oracle3, 2);
  await tx.wait(3);
  console.log(tx.hash);
  console.log(`StakeStarOracle::setOracle 2 is granted to ${oracle3}`);

  tx = await stakeStarOracleStrict.setOracle(oracle1, 0);
  await tx.wait(3);
  console.log(tx.hash);
  console.log(`StakeStarOracleStrict::setOracle 0 is granted to ${oracle1}`);
  tx = await stakeStarOracleStrict.setOracle(oracle2, 1);
  await tx.wait(3);
  console.log(tx.hash);
  console.log(`StakeStarOracleStrict::setOracle 1 is granted to ${oracle2}`);
  tx = await stakeStarOracleStrict.setOracle(oracle3, 2);
  await tx.wait(3);
  console.log(tx.hash);
  console.log(`StakeStarOracleStrict::setOracle 2 is granted to ${oracle3}`);
}

task("grant-OracleRole", "Set Oracle Roles").setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  await grantOracleRoles(
    hre,
    addresses.stakeStarOracle,
    addresses.stakeStarOracleStrict,
    addresses.oracle1,
    addresses.oracle2,
    addresses.oracle3
  );
});
