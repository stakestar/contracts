import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../fixture/fixture";
import { ConstantsLib, EPOCHS } from "../../scripts/constants";
import {currentNetwork} from "../../scripts/helpers";

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
      const {
        hre,
        stakeStarOracleStrict,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
        stakeStarOracleStrict3,
      } = await loadFixture(deployStakeStarFixture);

      const network = currentNetwork(hre);
      const oracle1_address = await stakeStarOracleStrict1.signer.getAddress();

      await expect(
        stakeStarOracleStrict1.setOracle(oracle1_address, 0)
      ).to.be.revertedWith(
        `AccessControl: account ${oracle1_address.toLowerCase()} is missing role ${ConstantsLib.DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        stakeStarOracleStrict.setOracle(oracle1_address, 3)
      ).to.be.revertedWith(
        "invalid oracle number"
      );

      await stakeStarOracleStrict.setOracle(oracle1_address, 2)
      await stakeStarOracleStrict.setOracle(oracle1_address, 0)

      await expect(stakeStarOracleStrict.latestTotalBalance()).to.be.revertedWith(
        `not initialized`
      );

      await stakeStarOracleStrict.setStrictEpochMode(true);

      await expect(
        stakeStarOracleStrict.setEpochUpdatePeriod(0)
      ).to.be.revertedWith(
        "invalid period"
      );

      const epoch_update_period = 24 * 3600;

      await expect(
        stakeStarOracleStrict1.setEpochUpdatePeriod(Math.floor(epoch_update_period / ConstantsLib.EPOCH_DURATION))
      ).to.be.revertedWith(
        `AccessControl: account ${oracle1_address.toLowerCase()} is missing role ${ConstantsLib.DEFAULT_ADMIN_ROLE}`
      );

      await stakeStarOracleStrict.setEpochUpdatePeriod(Math.floor(epoch_update_period / ConstantsLib.EPOCH_DURATION));

      await expect(stakeStarOracleStrict.save(1, 1)).to.be.revertedWith(
        `oracle role required`
      );

      const block0 = await hre.ethers.provider.getBlock("latest");

      const nextEpoch1 = await stakeStarOracleStrict.nextEpochToPublish();
      expect(nextEpoch1).to.be.eq(
          Math.floor((block0.timestamp - EPOCHS[network] - 1) / epoch_update_period) * epoch_update_period / 384
      );

      await expect(
        stakeStarOracleStrict1.save(nextEpoch1 - 1, 1000)
      ).to.be.revertedWith("only nextEpochToPublish() allowed");

      await expect(
        stakeStarOracleStrict.getCurrentProposal(stakeStarOracleStrict.address)
      ).to.be.revertedWith("invalid oracle");

      expect((await stakeStarOracleStrict.getCurrentProposal(oracle1_address)).proposed_epoch)
          .to.be.eq(0);

      await expect(stakeStarOracleStrict1.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch1, 1000, 1 << 24)
        .and.not.to.emit(stakeStarOracleStrict1, "Saved")

      expect((await stakeStarOracleStrict.getCurrentProposal(oracle1_address)).proposed_epoch)
          .to.be.eq(nextEpoch1);
      expect((await stakeStarOracleStrict.getCurrentProposal(oracle1_address)).proposed_balance)
          .to.be.eq(1000);

      // ignored
      await expect(stakeStarOracleStrict1.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch1, 1000, 1 << 24)
        .not.to.emit(stakeStarOracleStrict1, "Saved");

      // updated
      await expect(stakeStarOracleStrict1.save(nextEpoch1, 1001))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch1, 1001, 1 << 24)
        .not.to.emit(stakeStarOracleStrict1, "Saved");

      expect((await stakeStarOracleStrict.getCurrentProposal(oracle1_address)).proposed_epoch)
          .to.be.eq(nextEpoch1);
      expect((await stakeStarOracleStrict.getCurrentProposal(oracle1_address)).proposed_balance)
          .to.be.eq(1001);

      // change to original
      await expect(stakeStarOracleStrict1.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch1, 1000, 1 << 24)
        .not.to.emit(stakeStarOracleStrict1, "Saved");

      await expect(stakeStarOracleStrict2.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict2, "Saved")
        .withArgs(nextEpoch1, 1000)
        .and.to.emit(stakeStarOracleStrict2, "Proposed")
        .withArgs(nextEpoch1, 1000, 2 << 24);

      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).totalBalance
      ).to.eq(1000);
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).timestamp
      ).to.be.eq(await stakeStarOracleStrict.epochToTimestamp(nextEpoch1));

      await expect(
        stakeStarOracleStrict3.save(nextEpoch1, 1001)
      ).to.be.revertedWith("balance not equals");

      // accepted, but ignored
      // the third is late and ignored
      await expect(stakeStarOracleStrict3.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch1, 1000, 4 << 24)
        .and.not.to.emit(stakeStarOracleStrict1, "Saved");

      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).totalBalance
      ).to.eq(1000);
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).timestamp
      ).to.be.eq(await stakeStarOracleStrict.epochToTimestamp(nextEpoch1));

      await expect(
        stakeStarOracleStrict1.save(nextEpoch1 + 225, 11000)
      ).to.be.revertedWith("epoch from the future");


      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await stakeStarOracleStrict.epochToTimestamp(nextEpoch1 + epoch_update_period / 384 + 1)).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      // next epoch
      const nextEpoch2 = await stakeStarOracleStrict.nextEpochToPublish();
      expect(nextEpoch2).to.be.eq(nextEpoch1 + epoch_update_period / ConstantsLib.EPOCH_DURATION);

      await expect(
        stakeStarOracleStrict1.setStrictEpochMode(false)
      ).to.be.revertedWith(
        `AccessControl: account ${oracle1_address.toLowerCase()} is missing role ${ConstantsLib.DEFAULT_ADMIN_ROLE}`
      );

      await stakeStarOracleStrict.setStrictEpochMode(false);

      await expect(
        stakeStarOracleStrict1.save(nextEpoch1 - 1, 9000)
      ).to.be.revertedWith("epoch must increase");

      await stakeStarOracleStrict.setStrictEpochMode(true);

      // first proposal
      await expect(stakeStarOracleStrict2.save(nextEpoch2, 1200))
        .to.emit(stakeStarOracleStrict2, "Proposed")
        .withArgs(nextEpoch2, 1200, 2 << 24)
        .and.not.to.emit(stakeStarOracleStrict2, "Saved");

      // nothing changes
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).totalBalance
      ).to.eq(1000);
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).timestamp
      ).to.be.eq(await stakeStarOracleStrict.epochToTimestamp(nextEpoch1));

      // invalid balance => no consensus
      await expect(stakeStarOracleStrict3.save(nextEpoch2, 1201))
        .to.emit(stakeStarOracleStrict3, "Proposed")
        .withArgs(nextEpoch2, 1201, 4 << 24)
        .and.not.to.emit(stakeStarOracleStrict3, "Saved");

      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).totalBalance
      ).to.eq(1000);
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).timestamp
      ).to.be.eq(await stakeStarOracleStrict.epochToTimestamp(nextEpoch1));

      await stakeStarOracleStrict.setStrictEpochMode(false);

      await expect(
        stakeStarOracleStrict3.save(nextEpoch2 - 1, 1200)
      ).to.be.revertedWith("epoch must increase");

      // new consensus
      await expect(stakeStarOracleStrict3.save(nextEpoch2, 1200))
        .to.emit(stakeStarOracleStrict3, "Saved")
        .withArgs(nextEpoch2, 1200)
        .and.to.emit(stakeStarOracleStrict3, "Proposed")
        .withArgs(nextEpoch2, 1200, 4 << 24);

      // values updated
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).totalBalance
      ).to.eq(1200);
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).timestamp
      ).to.be.eq(await stakeStarOracleStrict.epochToTimestamp(nextEpoch2));

      // invalid balance
      await expect(
        stakeStarOracleStrict1.save(nextEpoch2, 1001)
      ).to.be.revertedWith("balance not equals");

      // accepted, but ignored
      await expect(stakeStarOracleStrict1.save(nextEpoch2, 1200))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch2, 1200, 1 << 24)
        .and.not.to.emit(stakeStarOracleStrict1, "Saved");

      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).totalBalance
      ).to.eq(1200);
      expect(
        (await stakeStarOracleStrict.latestTotalBalance()).timestamp
      ).to.be.eq(await stakeStarOracleStrict.epochToTimestamp(nextEpoch2));

      // utility
      expect(await stakeStarOracleStrict.epochToTimestamp(777)).to.be.eq(
        (await stakeStarOracleStrict._zeroEpochTimestamp()).add(777 * 384)
      );
    });
  });
});
