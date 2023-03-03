import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture/fixture";
import { ConstantsLib } from "../../scripts/constants";

describe("StakeStarOracle", function () {
  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { stakeStarOracle, manager, owner } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarOracle.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          owner.address
        )
      ).to.equal(true);

      expect(
        await stakeStarOracle.hasRole(
          ConstantsLib.MANAGER_ROLE,
          manager.address
        )
      ).to.equal(true);
    });
  });

  describe("Save", function () {
    it("Should save consensus data", async function () {
      const { stakeStarOracle, stakeStarOracleManager, owner } =
        await loadFixture(deployStakeStarFixture);

      expect(await stakeStarOracle._latestEpoch()).to.eq(0);

      const initialLatestTotalBalance =
        await stakeStarOracle.latestTotalBalance();

      expect(initialLatestTotalBalance.totalBalance).to.eq(0);
      expect(initialLatestTotalBalance.timestamp).to.be.eq(
        await stakeStarOracle._zeroEpochTimestamp()
      );

      await expect(stakeStarOracle.save(1, 1)).to.be.revertedWith(
        `AccessControl: account ${owner.address.toLowerCase()} is missing role ${
          ConstantsLib.MANAGER_ROLE
        }`
      );

      await stakeStarOracleManager.save(10, 10);

      await expect(stakeStarOracleManager.save(9, 11)).to.be.revertedWith(
        "epoch too old"
      );

      await expect(
        stakeStarOracleManager.save(999999999, 11)
      ).to.be.revertedWith("epoch from the future");

      await expect(stakeStarOracleManager.save(12, 15))
        .to.emit(stakeStarOracleManager, "Saved")
        .withArgs(12, 15);

      const finalLatestTotalBalance =
        await stakeStarOracle.latestTotalBalance();

      expect(finalLatestTotalBalance.totalBalance).to.eq(15);
      expect(finalLatestTotalBalance.timestamp).to.be.eq(
        await stakeStarOracle.epochTimestamp(12)
      );

      expect(await stakeStarOracle.epochTimestamp(777)).to.be.eq(
        (await stakeStarOracle._zeroEpochTimestamp()).add(777 * 384)
      );
    });
  });
});
