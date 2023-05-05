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

    const SStarETH = await hre.ethers.getContractFactory("SStarETH");
    const sstarETH = await SStarETH.attach(addresses.sstarETH);

    const StarETH = await hre.ethers.getContractFactory("StarETH");
    const starETH = await StarETH.attach(addresses.starETH);

    console.log(
      "StakeStar ETH Balance",
      humanify(await hre.ethers.provider.getBalance(stakeStar.address))
    );
    console.log(
      "StakeStarTreasury ETH Balance",
      humanify(
        await hre.ethers.provider.getBalance(addresses.stakeStarTreasury)
      )
    );
    console.log(
      "WithdrawalAddress ETH Balance",
      humanify(
        await hre.ethers.provider.getBalance(addresses.withdrawalAddress)
      )
    );
    console.log(
      "FeeRecipient ETH Balance",
      humanify(
        await hre.ethers.provider.getBalance(addresses.feeRecipient)
      )
    );
    console.log("SStarETH TotalSupply", humanify(await sstarETH.totalSupply()));
    console.log("StarETH TotalSupply", humanify(await starETH.totalSupply()));
    console.log();

    console.log(
      "pendingWithdrawalSum",
      humanify(await stakeStar.pendingWithdrawalSum())
    );
    console.log("localPoolSize", humanify(await stakeStar.localPoolSize()));
    console.log("localPoolWithdrawalFrequencyLimit", (await stakeStar.localPoolWithdrawalFrequencyLimit()).toNumber());
    console.log("maxRateDeviation", await stakeStar.maxRateDeviation());
    console.log();

    const snapshot0 = await stakeStar.snapshots(0);
    const snapshot1 = await stakeStar.snapshots(1);
    console.log("snapshot0 total_ETH", humanify(snapshot0.total_ETH));
    console.log("snapshot0 total_stakedStar", humanify(snapshot0.total_stakedStar));
    console.log(
      "snapshot0 timestamp",
      new Date(snapshot0.timestamp.toNumber() * 1000).toISOString()
    );
    console.log("snapshot1 total_ETH", humanify(snapshot1.total_ETH));
    console.log("snapshot1 total_stakedStar", humanify(snapshot1.total_stakedStar));
    console.log(
      "snapshot1 timestamp",
      new Date(snapshot1.timestamp.toNumber() * 1000).toISOString()
    );
    console.log();

    console.log("rate", humanify(await stakeStar["rate()"]()));
    console.log("rateEC", humanify(await stakeStar.rateForExtractCommision()));
    console.log(
      "rateCorrectionFactor",
      humanify(await stakeStar.rateCorrectionFactor())
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
      "ValidatorCreationAvailability",
      await stakeStar.validatorCreationAvailability()
    );
    console.log(
      "ValidatorDestructionAvailability",
      await stakeStar.validatorDestructionAvailability()
    );

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
      await stakeStarRegistry["getValidatorPublicKeys(uint8)"](
        ValidatorStatus.PENDING
      )
    ).filter((key) => key !== "0x");
    if (pendingPublicKeys.length > 0) {
      console.log(`PENDING validators\n${pendingPublicKeys.join("\n")}`);
    }
    const activePublicKeys = (
      await stakeStarRegistry["getValidatorPublicKeys(uint8)"](
        ValidatorStatus.ACTIVE
      )
    ).filter((key) => key !== "0x");
    if (activePublicKeys.length > 0) {
      console.log(`ACTIVE validators\n${activePublicKeys.join("\n")}`);
    }
    const exitingPublicKeys = (
      await stakeStarRegistry["getValidatorPublicKeys(uint8)"](
        ValidatorStatus.EXITING
      )
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

    const StakeStarOracleStrict = await hre.ethers.getContractFactory(
      "StakeStarOracleStrict"
    );
    const stakeStarOracleStrict = await StakeStarOracleStrict.attach(
      addresses.stakeStarOracleStrict
    );

    const latestTotalBalance = await stakeStarOracleStrict.latestTotalBalance();
    console.log(
      "StakeStarOracleStrict::latestTotalBalance",
      humanify(latestTotalBalance.totalBalance),
      new Date(latestTotalBalance.timestamp.toNumber() * 1000).toISOString()
    );
    console.log();
  }
);
