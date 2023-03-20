import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork } from "../helpers";

task(
  "upgrade-StakeStarOracleStrict",
  "Upgrades StakeStarOracleStrict contract"
).setAction(async (args, hre) => {
  const network = currentNetwork(hre);
  const addresses = ADDRESSES[network];

  const StakeStarOracleStrict = await hre.ethers.getContractFactory(
    "StakeStarOracleStrict"
  );
  await hre.upgrades.upgradeProxy(
    addresses.stakeStarOracleStrict,
    StakeStarOracleStrict
  );
  console.log(
    `StakeStarOracleStrict is upgraded at ${addresses.stakeStarOracleStrict}`
  );
});
