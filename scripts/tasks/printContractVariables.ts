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

    console.log("stakingSurplusA", humanify(await stakeStar.stakingSurplusA()));
    const timestampA = (await stakeStar.timestampA()).toNumber();
    console.log("timestampA", new Date(timestampA * 1000).toISOString());
    console.log("stakingSurplusB", humanify(await stakeStar.stakingSurplusB()));
    const timestampB = (await stakeStar.timestampB()).toNumber();
    console.log("timestampB", new Date(timestampB * 1000).toISOString());
    console.log();

    console.log(
      "reservedTreasuryCommission",
      humanify(await stakeStar.reservedTreasuryCommission())
    );
    console.log(
      "currentApproximateRate",
      humanify(await stakeStar.currentApproximateRate())
    );
    console.log();

    const StakeStarETH = await hre.ethers.getContractFactory("StakeStarETH");
    const stakeStarETH = await StakeStarETH.attach(addresses.stakeStarETH);

    console.log("rate", humanify(await stakeStarETH.rate()));
    console.log("totalSupply", humanify(await stakeStarETH.totalSupply()));
    console.log(
      "totalSupplyEth",
      humanify(await stakeStarETH.totalSupplyEth())
    );
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

    const StakeStarProvider = await hre.ethers.getContractFactory(
      "StakeStarProvider"
    );
    const stakeStarProvider = await StakeStarProvider.attach(
      addresses.stakeStarProvider
    );
    console.log(
      "StakeStarProvider::avgValidatorBalanceLowerLimit",
      humanify(await stakeStarProvider._avgValidatorBalanceLowerLimit()),
      "ETH"
    );
    console.log(
      "StakeStarProvider::avgValidatorBalanceUpperLimit",
      humanify(await stakeStarProvider._avgValidatorBalanceUpperLimit()),
      "ETH"
    );
    console.log(
      "StakeStarProvider::epochGapLimit",
      humanify(await stakeStarProvider._epochGapLimit(), 0, 0),
      "seconds"
    );
    console.log(
      "StakeStarProvider::aprLimit",
      humanify(await stakeStarProvider._aprLimit()),
      "ETH"
    );
    console.log(
      "StakeStarProvider::validatorCountDiffLimit",
      await stakeStarProvider._validatorCountDiffLimit()
    );
    console.log();

    const latestStakingSurplus = await stakeStarProvider.latestStakingSurplus();
    console.log(
      "StakeStarProvider::latestStakingSurplus",
      humanify(latestStakingSurplus.stakingSurplus),
      new Date(latestStakingSurplus.timestamp.toNumber() * 1000).toISOString()
    );
    console.log();
  }
);
