import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture";
import { EPOCHS } from "../../scripts/constants";
import { currentNetwork } from "../../scripts/helpers";

describe("StakeStarProvider", function () {
  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { stakeStarProvider, manager, owner } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarProvider.hasRole(
          await stakeStarProvider.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.equal(true);

      expect(
        await stakeStarProvider.hasRole(
          await stakeStarProvider.MANAGER_ROLE(),
          manager.address
        )
      ).to.equal(true);
    });
  });

  describe("SetLimits", function () {
    it("Should set the limits", async function () {
      const { stakeStarProvider, stakeStarProviderManager, manager } =
        await loadFixture(deployStakeStarFixture);

      await expect(
        stakeStarProviderManager.setLimits(0, 0, 0, 0, 0)
      ).to.be.revertedWith(
        `AccessControl: account ${manager.address.toLowerCase()} is missing role ${await stakeStarProviderManager.DEFAULT_ADMIN_ROLE()}`
      );

      await expect(stakeStarProvider.setLimits(1, 1, 1, 1, 1))
        .to.emit(stakeStarProviderManager, "SetLimits")
        .withArgs(1, 1, 1, 1, 1);

      expect(await stakeStarProvider._avgValidatorBalanceLowerLimit()).to.equal(
        1
      );
      expect(await stakeStarProvider._avgValidatorBalanceUpperLimit()).to.equal(
        1
      );
      expect(await stakeStarProvider._epochGapLimit()).to.equal(1);
      expect(await stakeStarProvider._aprLimit()).to.equal(1);
      expect(await stakeStarProvider._validatorCountDiffLimit()).to.equal(1);
    });
  });

  describe("Save", function () {
    it("Should save consensus data", async function () {
      const { stakeStarProvider, stakeStarProviderManager, owner, hre } =
        await loadFixture(deployStakeStarFixture);

      expect(await stakeStarProvider._latestEpoch()).to.eq(0);

      const initialLatestStakingSurplus =
        await stakeStarProvider.latestStakingSurplus();

      expect(initialLatestStakingSurplus.stakingSurplus).to.eq(0);
      expect(initialLatestStakingSurplus.timestamp).to.be.eq(
        await stakeStarProvider._zeroEpochTimestamp()
      );

      await expect(stakeStarProvider.save(1, 1, 1)).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${await stakeStarProvider.MANAGER_ROLE()}`
      );

      await stakeStarProvider.setLimits(
        hre.ethers.utils.parseUnits("16"),
        hre.ethers.utils.parseUnits("40"),
        24 * 3600,
        hre.ethers.utils.parseUnits("3.2"), // 10% APR
        3
      );

      // 0 - OK
      // 1 - given epoch is younger that latestEpoch
      // 2 - given epoch is from the future
      // 3 - epochGap > epochGapLimit
      // 4 - avgValidatorBalance is out of bounds
      // 5 - apr > aprLimit
      // 6 - validatorCountDiff > validatorCountDiffLimit

      await expect(stakeStarProviderManager.save(0, 0, 0))
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(1);

      await expect(stakeStarProviderManager.save(99999999, 0, 0))
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(2);

      await expect(stakeStarProviderManager.save(1, 0, 0))
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(3);

      const currentTimestamp = (
        await hre.ethers.provider.getBlock(
          await hre.ethers.provider.getBlockNumber()
        )
      ).timestamp;
      const currentEpochNumber = Math.floor(
        (currentTimestamp - EPOCHS[currentNetwork(hre)]) / 384
      );

      await expect(
        stakeStarProviderManager.save(
          currentEpochNumber - 1,
          hre.ethers.utils.parseUnits("1"),
          1
        )
      )
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(4);

      await expect(
        stakeStarProviderManager.save(
          currentEpochNumber - 1,
          hre.ethers.utils.parseUnits("41"),
          1
        )
      )
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(4);

      await expect(
        stakeStarProviderManager.save(
          currentEpochNumber - 1,
          hre.ethers.utils.parseUnits("30"),
          2
        )
      )
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(4);

      await expect(
        stakeStarProviderManager.save(
          currentEpochNumber - 1,
          hre.ethers.utils.parseUnits("90"),
          4
        )
      )
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(6);

      await expect(
        stakeStarProviderManager.save(
          currentEpochNumber - 10,
          hre.ethers.utils.parseUnits("32.1"),
          1
        )
      )
        .to.emit(stakeStarProviderManager, "Saved")
        .withArgs(
          currentEpochNumber - 10,
          hre.ethers.utils.parseUnits("32.1"),
          1
        );

      const latestStakingSurplus =
        await stakeStarProviderManager.latestStakingSurplus();
      expect(latestStakingSurplus.stakingSurplus).to.eq(
        hre.ethers.utils.parseUnits("0.1")
      );
      expect(latestStakingSurplus.timestamp).to.be.eq(
        await stakeStarProvider.epochTimestamp(currentEpochNumber - 10)
      );
      expect(await stakeStarProviderManager._latestEpoch()).to.equal(
        currentEpochNumber - 10
      );
      expect(
        await stakeStarProviderManager._totalBalance(currentEpochNumber - 10)
      ).to.equal(hre.ethers.utils.parseUnits("32.1"));
      expect(
        await stakeStarProviderManager._validatorCount(currentEpochNumber - 10)
      ).to.equal(1);

      await expect(
        stakeStarProviderManager.save(
          currentEpochNumber - 9,
          hre.ethers.utils.parseUnits("32.2"),
          1
        )
      )
        .to.be.revertedWithCustomError(
          stakeStarProviderManager,
          "ValidationFailed"
        )
        .withArgs(5);

      await stakeStarProviderManager.save(
        currentEpochNumber - 9,
        hre.ethers.utils.parseUnits("32.00001"),
        1
      );
    });
  });
});
