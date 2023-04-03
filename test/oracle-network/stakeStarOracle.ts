import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../test-helpers/fixture";
import { ConstantsLib } from "../../scripts/constants";

describe("StakeStarOracle", function () {
  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { stakeStarOracle, owner } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarOracle.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          owner.address
        )
      ).to.equal(true);
    });
  });

  describe("Save", function () {
    it("Should save consensus data", async function () {
      const {
        stakeStarOracle,
        stakeStarOracle1,
        stakeStarOracle2,
        stakeStarOracle3,
      } = await loadFixture(deployStakeStarFixture);

      const initialLatestTotalBalance =
        await stakeStarOracle.latestTotalBalance();

      expect(initialLatestTotalBalance.totalBalance).to.eq(0);
      expect(initialLatestTotalBalance.timestamp).to.be.eq(
        await stakeStarOracle._zeroEpochTimestamp()
      );

      await stakeStarOracle.setStrictEpochMode(true);

      await expect(stakeStarOracle.save(1, 1)).to.be.revertedWith(
        `oracle role required`
      );

      await expect(stakeStarOracle.save(1, 1)).to.be.revertedWith(
        `oracle role required`
      );

      const nextEpochToPublish = await stakeStarOracle.nextEpochToPublish();
      console.log("nextEpochToPublish=", nextEpochToPublish);
      expect(nextEpochToPublish).to.be.gt(0);

      await expect(
        stakeStarOracle1.save(nextEpochToPublish - 1, 1000)
      ).to.be.revertedWith("only nextEpochToPublish() allowed");

      await expect(stakeStarOracle1.save(nextEpochToPublish, 1000))
        .to.emit(stakeStarOracle1, "Proposed")
        .withArgs(nextEpochToPublish, 1000, 1 << 24);

      await expect(
        stakeStarOracle1.save(nextEpochToPublish, 1000)
      ).to.be.revertedWith("oracle already submitted result");

      await expect(
        stakeStarOracle2.save(nextEpochToPublish, 1001)
      ).to.be.revertedWith("balance not equals");

      await expect(stakeStarOracle2.save(nextEpochToPublish, 1000))
        .to.emit(stakeStarOracle2, "Saved")
        .withArgs(nextEpochToPublish, 1000);

      expect((await stakeStarOracle.latestTotalBalance()).totalBalance).to.eq(
        1000
      );
      expect((await stakeStarOracle.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracle.epochToTimestamp(nextEpochToPublish)
      );

      await expect(
        stakeStarOracle3.save(nextEpochToPublish, 1001)
      ).to.be.revertedWith("balance not equals");

      // accepted, but ignored
      await stakeStarOracle3.save(nextEpochToPublish, 1000);

      expect((await stakeStarOracle.latestTotalBalance()).totalBalance).to.eq(
        1000
      );
      expect((await stakeStarOracle.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracle.epochToTimestamp(nextEpochToPublish)
      );

      await expect(
        stakeStarOracle1.save(nextEpochToPublish + 225, 11000)
      ).to.be.revertedWith("epoch from the future");

      await stakeStarOracle.setStrictEpochMode(false);
      await expect(
        stakeStarOracle1.save(nextEpochToPublish - 1, 9000)
      ).to.be.revertedWith("epoch must increase");

      // next epoch
      const nextEpoch = nextEpochToPublish + 20;

      await stakeStarOracle2.save(nextEpoch, 1200);

      // nothing changes
      expect((await stakeStarOracle.latestTotalBalance()).totalBalance).to.eq(
        1000
      );
      expect((await stakeStarOracle.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracle.epochToTimestamp(nextEpochToPublish)
      );

      await expect(stakeStarOracle3.save(nextEpoch, 1001)).to.be.revertedWith(
        "balance not equals"
      );

      await expect(
        stakeStarOracle3.save(nextEpochToPublish, 1000)
      ).to.be.revertedWith("epoch must increase");

      // new consensus
      await expect(stakeStarOracle3.save(nextEpoch, 1200))
        .to.emit(stakeStarOracle3, "Saved")
        .withArgs(nextEpoch, 1200);

      // values updated
      expect((await stakeStarOracle.latestTotalBalance()).totalBalance).to.eq(
        1200
      );
      expect((await stakeStarOracle.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracle.epochToTimestamp(nextEpoch)
      );

      // invalid balance
      await expect(stakeStarOracle1.save(nextEpoch, 1001)).to.be.revertedWith(
        "balance not equals"
      );

      // accepted, but ignored
      await stakeStarOracle1.save(nextEpoch, 1200);

      expect((await stakeStarOracle.latestTotalBalance()).totalBalance).to.eq(
        1200
      );
      expect((await stakeStarOracle.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracle.epochToTimestamp(nextEpoch)
      );

      // utility
      expect(await stakeStarOracle.epochToTimestamp(777)).to.be.eq(
        (await stakeStarOracle._zeroEpochTimestamp()).add(777 * 384)
      );
    });
  });
});
