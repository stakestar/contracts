import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../test-helpers/fixture";
import {ConstantsLib, EPOCHS} from "../../scripts/constants";
import {currentNetwork} from "../../scripts/helpers";

// Returns a random number between min (inclusive) and max (exclusive)
function getRandomInt(min : number, max : number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array : number[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

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


  describe("RandomOracleTest", function () {
    it("Randomized oracle test should work", async function () {
      const {
        hre,
        stakeStarOracle,
        stakeStarOracle1,
        stakeStarOracle2,
        stakeStarOracle3,
      } = await loadFixture(deployStakeStarFixture);

      const verbose_mode = false;
      const vlog = function(...args : any[]) {
        if (verbose_mode) console.log(...args)
      }

      const network = currentNetwork(hre);
      const epoch_update_period = 24 * 3600;
      const gasMeasureMode = true

      const oracles = [stakeStarOracle1, stakeStarOracle2, stakeStarOracle3];
      const ORACLES_COUNT = 3;
      const MIN_CONSENSUS_COUNT = 2;

      const MIN_ACTION = 0;
      const NO_ACTION = 0;
      const SAVE_CORRECT_ALL = 1;
      const MAX_ACTION = 2;

      let currentBalance : number = 1000;
      let currentEpoch : number = (await stakeStarOracle.nextEpochToPublish());

      await stakeStarOracle1.save(currentEpoch, currentBalance);
      await stakeStarOracle2.save(currentEpoch, currentBalance);
      let lastSetEpoch = currentEpoch;

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await hre.ethers.provider.getBlock("latest")).timestamp + epoch_update_period + 1,
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      for (let strict_mode of [true, false]) {
        vlog("StrictMode:", strict_mode);

        await stakeStarOracle.setStrictEpochMode(strict_mode);

        for (let iteration = 0; iteration < 100; ++iteration) {
          vlog("ITERATION:", iteration);

          const currentBlock = await hre.ethers.provider.getBlock("latest");
          vlog("Current Block Timestamp: ", currentBlock.timestamp);

          let nextEpoch;
          if (strict_mode) {
            nextEpoch = await stakeStarOracle.nextEpochToPublish();
            expect(nextEpoch).to.be.eq(
                Math.floor((currentBlock.timestamp - EPOCHS[network] - 1) / epoch_update_period) * epoch_update_period / 384
            );
          } else {
            nextEpoch = lastSetEpoch + getRandomInt(1, 500);
            const maxEpochPossible = (await stakeStarOracle.timestampToEpoch(
                (await hre.ethers.provider.getBlock("latest")).timestamp)) - 1;
            nextEpoch = nextEpoch > maxEpochPossible ? maxEpochPossible : nextEpoch;
          }
          let nextBalance = currentBalance + getRandomInt(-100, 1000);

          let repeats = gasMeasureMode ? 1 : 2;
          let oracles_succeeded : { [key:number]: boolean; } = {};
          let has_consensus = false;

          const already_in_consensus = (await stakeStarOracle.timestampToEpoch(
              (await stakeStarOracle.latestTotalBalance()).timestamp)) === nextEpoch;

          while (repeats--) {
            let oracles_order = [...Array(ORACLES_COUNT).keys()]
            shuffleArray(oracles_order);

            for (let oracle_no of oracles_order) {
              const action_id = gasMeasureMode ? SAVE_CORRECT_ALL : getRandomInt(MIN_ACTION, MAX_ACTION);
              switch (action_id) {
                case NO_ACTION:
                  vlog("ORACLE", oracle_no, "NO ACTION");
                  break;
                case SAVE_CORRECT_ALL:
                  vlog("ORACLE", oracle_no, "SAVE CORRECT ALL", nextEpoch, nextBalance);

                  let confirmations = 0;
                  for (let i = 0; i < ORACLES_COUNT; ++i) {
                    if (i !== oracle_no && oracles_succeeded[i]) {
                      ++confirmations;
                    }
                  }

                  if (oracles_succeeded[oracle_no]) {
                    await expect(
                      oracles[oracle_no].save(nextEpoch, nextBalance)
                    ).to.be.revertedWith("oracle already submitted result");
                  } else if (already_in_consensus) {
                    await expect(
                      oracles[oracle_no].save(nextEpoch, nextBalance)
                    ).to.be.revertedWith("balance not equals");
                  } else {
                    if (!has_consensus && confirmations == MIN_CONSENSUS_COUNT - 1) {
                      await expect(oracles[oracle_no].save(nextEpoch, nextBalance))
                        .to.emit(oracles[oracle_no], "Proposed")
                        .withArgs(nextEpoch, nextBalance, 1 << (24 + oracle_no))
                        .and.emit(oracles[oracle_no], "Saved")
                        .withArgs(nextEpoch, nextBalance);

                      vlog("GOT CONSENSUS");
                      has_consensus = true;
                    } else {
                      await expect(oracles[oracle_no].save(nextEpoch, nextBalance))
                        .to.emit(oracles[oracle_no], "Proposed")
                        .withArgs(nextEpoch, nextBalance, 1 << (24 + oracle_no))
                        .and.not.to.emit(oracles[oracle_no], "Saved");
                    }
                  }

                  oracles_succeeded[oracle_no] = true;

                  break;
              }
            }
          }

          currentBalance = (await stakeStarOracle.latestTotalBalance()).totalBalance.toNumber();
          currentEpoch = await stakeStarOracle.timestampToEpoch((await stakeStarOracle.latestTotalBalance()).timestamp);
          lastSetEpoch = nextEpoch;
          vlog("Current Balance:", currentBalance);
          vlog("Current Epoch:", currentEpoch);

          // skip any from [1, 1.5, 2] days
          await hre.network.provider.send("evm_setNextBlockTimestamp", [
            ((await hre.ethers.provider.getBlock("latest")).timestamp
                + 1 + getRandomInt(2, 4) * (epoch_update_period / 2)),
          ]);
          await hre.network.provider.request({ method: "evm_mine", params: [] });
        }
      }

    });
  });

});
