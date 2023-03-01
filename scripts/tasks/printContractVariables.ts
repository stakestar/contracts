import { task } from "hardhat/config";
import { ADDRESSES } from "../constants";
import { currentNetwork, humanify } from "../helpers";
import { ValidatorStatus } from "../types";

task("printContractVariables", "Prints contracts variables").setAction(
  async (args, hre) => {
    const network = currentNetwork(hre);
    const addresses = ADDRESSES[network];

    const StakeStar = await hre.ethers.getContractFactory("StakeStar");
    const stakeStar = await StakeStar.attach(addresses.stakeStar);

    console.log(
      "StakeStar ETH Balance",
      humanify(await hre.ethers.provider.getBalance(stakeStar.address))
    );
    console.log(
      "pendingUnstakeSum",
      humanify(await stakeStar.pendingUnstakeSum())
    );
    console.log("localPoolSize", humanify(await stakeStar.localPoolSize()));
    console.log();

    const snapshot0 = await stakeStar.snapshots(0);
    const snapshot1 = await stakeStar.snapshots(0);
    console.log("snapshot0 total_ETH", humanify(snapshot0.total_ETH));
    console.log("snapshot0 total_ssETH", humanify(snapshot0.total_ssETH));
    console.log(
      "snapshot0 timestamp",
      new Date(snapshot0.timestamp.toNumber() * 1000).toISOString()
    );
    console.log("snapshot1 total_ETH", humanify(snapshot1.total_ETH));
    console.log("snapshot1 total_ssETH", humanify(snapshot1.total_ssETH));
    console.log(
      "snapshot1 timestamp",
      new Date(snapshot1.timestamp.toNumber() * 1000).toISOString()
    );
    console.log();

    console.log(
      "reservedTreasuryCommission",
      humanify(await stakeStar.reservedTreasuryCommission())
    );
    console.log("rate", humanify(await stakeStar["rate(uint256)"](Date.now())));
    console.log();

    const StakeStarRegistry = await hre.ethers.getContractFactory(
      "StakeStarRegistry"
    );
    const stakeStarRegistry = await StakeStarRegistry.attach(
      addresses.stakeStarRegistry
    );

    const pendingValidatorCount =
      await stakeStarRegistry.countValidatorPublicKeys(ValidatorStatus.PENDING);
    const activeValidatorCount =
      await stakeStarRegistry.countValidatorPublicKeys(ValidatorStatus.ACTIVE);
    const exitingValidatorCount =
      await stakeStarRegistry.countValidatorPublicKeys(ValidatorStatus.EXITING);
    const totalValidatorCount = pendingValidatorCount
      .add(activeValidatorCount)
      .add(exitingValidatorCount);

    console.log(
      "PENDING validator count",
      humanify(pendingValidatorCount, 0, 0)
    );
    console.log("ACTIVE validator count", humanify(activeValidatorCount, 0, 0));
    console.log(
      "EXITING validator count",
      humanify(exitingValidatorCount, 0, 0)
    );
    console.log("TOTAL validator count", humanify(totalValidatorCount, 0, 0));
    console.log();

    const pendingPublicKeys = (
      await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.PENDING)
    ).filter((key) => key !== "0x");
    if (pendingPublicKeys.length > 0) {
      console.log(`PENDING validators\n${pendingPublicKeys.join("\n")}`);
    }
    const activePublicKeys = (
      await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.ACTIVE)
    ).filter((key) => key !== "0x");
    if (activePublicKeys.length > 0) {
      console.log(`ACTIVE validators\n${activePublicKeys.join("\n")}`);
    }
    const exitingPublicKeys = (
      await stakeStarRegistry.getValidatorPublicKeys(ValidatorStatus.EXITING)
    ).filter((key) => key !== "0x");
    if (exitingPublicKeys.length > 0) {
      console.log(`EXITING validators\n${exitingPublicKeys.join("\n")}`);
    }
    console.log();

    console.log(
      "ETH which is held on validators",
      humanify(hre.ethers.utils.parseEther("32").mul(totalValidatorCount))
    );
    console.log();

    const StakeStarOracle = await hre.ethers.getContractFactory(
      "StakeStarOracle"
    );
    const stakeStarOracle = await StakeStarOracle.attach(
      addresses.oracleNetwork
    );

    const latestTotalBalance = await stakeStarOracle.latestTotalBalance();
    console.log(
      "StakeStarOracle::latestStakingSurplus",
      humanify(latestTotalBalance.totalBalance),
      new Date(latestTotalBalance.timestamp.toNumber() * 1000).toISOString()
    );
    console.log();
  }
);
