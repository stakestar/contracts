import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture/fixture";
import { ConstantsLib } from "../../scripts/constants";

describe("StakeStarOracleStrict", function () {
  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { stakeStarOracleStrict, owner } = await loadFixture(
        deployStakeStarFixture
      );

      expect(
        await stakeStarOracleStrict.hasRole(
          ConstantsLib.DEFAULT_ADMIN_ROLE,
          owner.address
        )
      ).to.equal(true);
    });
  });

  describe("Save", function () {
    it("Should save consensus data", async function () {
      const { stakeStarOracleStrict, stakeStarOracleStrictAdmin, stakeStarOracleStrict1, stakeStarOracleStrict2, stakeStarOracleStrict3 } =
        await loadFixture(deployStakeStarFixture);

      const initialLatestTotalBalance = await stakeStarOracleStrict.latestTotalBalance();

      expect(initialLatestTotalBalance.totalBalance).to.eq(0);
      expect(initialLatestTotalBalance.timestamp).to.be.eq(await stakeStarOracleStrict._zeroEpochTimestamp());

      await stakeStarOracleStrictAdmin.setStrictEpochMode(true);

      await expect(stakeStarOracleStrict.save(1, 1)).to.be.revertedWith(
        `oracle role required`
      );

      await expect(stakeStarOracleStrictAdmin.save(1, 1)).to.be.revertedWith(
        `oracle role required`
      );

      const nextEpoch1 = await stakeStarOracleStrict.nextEpochToPublish();
      console.log("nextEpochToPublish=", nextEpoch1)
      expect(nextEpoch1).to.be.gt(0);

      await expect(stakeStarOracleStrict1.save(nextEpoch1 - 1, 1000)).to.be.revertedWith(
        "only nextEpochToPublish() allowed"
      );

      await expect(stakeStarOracleStrict1.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch1, 1000, 1 << 24);

      // ignored
      await stakeStarOracleStrict1.save(nextEpoch1, 1000);
      // updated
      await stakeStarOracleStrict1.save(nextEpoch1, 1001);
      // change to original
      await stakeStarOracleStrict1.save(nextEpoch1, 1000);

      await expect(stakeStarOracleStrict2.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict2, "Saved")
        .withArgs(nextEpoch1, 1000);

      expect((await stakeStarOracleStrict.latestTotalBalance()).totalBalance).to.eq(1000);
      expect((await stakeStarOracleStrict.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracleStrict.epochToTimestamp(nextEpoch1)
      );

      await expect(stakeStarOracleStrict3.save(nextEpoch1, 1001)).to.be.revertedWith(
        "balance not equals"
      );

      // accepted, but ignored
      await stakeStarOracleStrict3.save(nextEpoch1, 1000);

      expect((await stakeStarOracleStrict.latestTotalBalance()).totalBalance).to.eq(1000);
      expect((await stakeStarOracleStrict.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracleStrict.epochToTimestamp(nextEpoch1)
      );

      await expect(
        stakeStarOracleStrict1.save(nextEpoch1 + 225, 11000)
      ).to.be.revertedWith("epoch from the future");

      await stakeStarOracleStrictAdmin.setStrictEpochMode(false);
      await expect(stakeStarOracleStrict1.save(nextEpoch1 - 1, 9000)).to.be.revertedWith(
        "epoch must increase"
      );


      // next epoch
      const nextEpoch2 = nextEpoch1 + 20

      await stakeStarOracleStrict2.save(nextEpoch2, 1200);

      // nothing changes
      expect((await stakeStarOracleStrict.latestTotalBalance()).totalBalance).to.eq(1000);
      expect((await stakeStarOracleStrict.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracleStrict.epochToTimestamp(nextEpoch1)
      );

      // invalid balance => no consensus
      stakeStarOracleStrict3.save(nextEpoch2, 1201);

      expect((await stakeStarOracleStrict.latestTotalBalance()).totalBalance).to.eq(1000);
      expect((await stakeStarOracleStrict.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracleStrict.epochToTimestamp(nextEpoch1)
      );

      await expect(stakeStarOracleStrict3.save(nextEpoch2 - 1, 1200)).to.be.revertedWith(
        "epoch must increase"
      );

      // new consensus
      await expect(stakeStarOracleStrict3.save(nextEpoch2, 1200))
        .to.emit(stakeStarOracleStrict3, "Saved")
        .withArgs(nextEpoch2, 1200);

      // values updated
      expect((await stakeStarOracleStrict.latestTotalBalance()).totalBalance).to.eq(1200);
      expect((await stakeStarOracleStrict.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracleStrict.epochToTimestamp(nextEpoch2)
      );

      // invalid balance
      await expect(stakeStarOracleStrict1.save(nextEpoch2, 1001)).to.be.revertedWith(
        "balance not equals"
      );

      // accepted, but ignored
      await stakeStarOracleStrict1.save(nextEpoch2, 1200);

      expect((await stakeStarOracleStrict.latestTotalBalance()).totalBalance).to.eq(1200);
      expect((await stakeStarOracleStrict.latestTotalBalance()).timestamp).to.be.eq(
        await stakeStarOracleStrict.epochToTimestamp(nextEpoch2)
      );

      // utility
      expect(await stakeStarOracleStrict.epochToTimestamp(777)).to.be.eq(
        (await stakeStarOracleStrict._zeroEpochTimestamp()).add(777 * 384)
      );
    });
  });
});
