import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployStakeStarFixture } from "../test-helpers/fixture";
import { ConstantsLib, EPOCHS } from "../../scripts/constants";
import { currentNetwork } from "../../scripts/helpers";

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
        `AccessControl: account ${oracle1_address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
      );

      await expect(
        stakeStarOracleStrict.setOracle(oracle1_address, 3)
      ).to.be.revertedWith("invalid oracle number");

      await stakeStarOracleStrict.setOracle(oracle1_address, 2);
      await stakeStarOracleStrict.setOracle(oracle1_address, 0);

      await expect(
        stakeStarOracleStrict.latestTotalBalance()
      ).to.be.revertedWith(`not initialized`);

      await stakeStarOracleStrict.setStrictEpochMode(true);

      await expect(
        stakeStarOracleStrict.setEpochUpdatePeriod(0)
      ).to.be.revertedWith("invalid period");

      const epoch_update_period = 24 * 3600;

      await expect(
        stakeStarOracleStrict1.setEpochUpdatePeriod(
          Math.floor(epoch_update_period / ConstantsLib.EPOCH_DURATION)
        )
      ).to.be.revertedWith(
        `AccessControl: account ${oracle1_address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
      );

      await stakeStarOracleStrict.setEpochUpdatePeriod(
        Math.floor(epoch_update_period / ConstantsLib.EPOCH_DURATION)
      );

      await expect(stakeStarOracleStrict.save(1, 1)).to.be.revertedWith(
        `oracle role required`
      );

      const block0 = await hre.ethers.provider.getBlock("latest");

      const nextEpoch1 = await stakeStarOracleStrict.nextEpochToPublish();
      expect(nextEpoch1).to.be.eq(
        (Math.floor(
          (block0.timestamp - EPOCHS[network] - 1) / epoch_update_period
        ) *
          epoch_update_period) /
          384
      );

      await expect(
        stakeStarOracleStrict1.save(nextEpoch1 - 1, 1000)
      ).to.be.revertedWith("only nextEpochToPublish() allowed");

      await expect(
        stakeStarOracleStrict.getCurrentProposal(stakeStarOracleStrict.address)
      ).to.be.revertedWith("invalid oracle");

      expect(
        (await stakeStarOracleStrict.getCurrentProposal(oracle1_address))
          .proposed_epoch
      ).to.be.eq(0);

      await expect(stakeStarOracleStrict1.save(nextEpoch1, 1000))
        .to.emit(stakeStarOracleStrict1, "Proposed")
        .withArgs(nextEpoch1, 1000, 1 << 24)
        .and.not.to.emit(stakeStarOracleStrict1, "Saved");

      expect(
        (await stakeStarOracleStrict.getCurrentProposal(oracle1_address))
          .proposed_epoch
      ).to.be.eq(nextEpoch1);
      expect(
        (await stakeStarOracleStrict.getCurrentProposal(oracle1_address))
          .proposed_balance
      ).to.be.eq(1000);

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

      expect(
        (await stakeStarOracleStrict.getCurrentProposal(oracle1_address))
          .proposed_epoch
      ).to.be.eq(nextEpoch1);
      expect(
        (await stakeStarOracleStrict.getCurrentProposal(oracle1_address))
          .proposed_balance
      ).to.be.eq(1001);

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
        (
          await stakeStarOracleStrict.epochToTimestamp(
            nextEpoch1 + epoch_update_period / 384 + 1
          )
        ).toNumber(),
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      // next epoch
      const nextEpoch2 = await stakeStarOracleStrict.nextEpochToPublish();
      expect(nextEpoch2).to.be.eq(
        nextEpoch1 + epoch_update_period / ConstantsLib.EPOCH_DURATION
      );

      await expect(
        stakeStarOracleStrict1.setStrictEpochMode(false)
      ).to.be.revertedWith(
        `AccessControl: account ${oracle1_address.toLowerCase()} is missing role ${
          ConstantsLib.DEFAULT_ADMIN_ROLE
        }`
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


  describe("RandomOracleTest", function () {
    it("Randomized oracle test should work", async function () {
      const {
        hre,
        stakeStarOracleStrict,
        stakeStarOracleStrict1,
        stakeStarOracleStrict2,
        stakeStarOracleStrict3,
      } = await loadFixture(deployStakeStarFixture);

      const network = currentNetwork(hre);
      const epoch_update_period = 24 * 3600;
      const gasMeasureMode = true

      const oracles = [stakeStarOracleStrict1, stakeStarOracleStrict2, stakeStarOracleStrict3];
      const ORACLES_COUNT = 3;
      const MIN_CONSENSUS_COUNT = 2;

      const MIN_ACTION = 0;
      const NO_ACTION = 0;
      const SAVE_CORRECT_ALL = 1;
      const SAVE_CORRECT_EPOCH_INCORRECT_BALANCE = 2;
      const SAVE_INCORRECT_EPOCH_CORRECT_BALANCE = 3;
      const SAVE_INCORRECT_EPOCH_INCORRECT_BALANCE = 4;
      const MAX_ACTION = 4;

      let currentBalance : number = 1000;
      let currentEpoch : number = (await stakeStarOracleStrict.nextEpochToPublish());

      await stakeStarOracleStrict1.save(currentEpoch, currentBalance);
      await stakeStarOracleStrict2.save(currentEpoch, currentBalance);
      let lastSetEpoch = currentEpoch;

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await hre.ethers.provider.getBlock("latest")).timestamp + epoch_update_period + 1,
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      for (let strict_mode of [true, false]) {
        console.log("StrictMode:", strict_mode);

        await stakeStarOracleStrict.setStrictEpochMode(strict_mode);

        for (let iteration = 0; iteration < 100; ++iteration) {
          console.log("ITERATION:", iteration);

          const currentBlock = await hre.ethers.provider.getBlock("latest");
          console.log("Current Block Timestamp: ", currentBlock.timestamp);

          let nextEpoch;
          if (strict_mode) {
            nextEpoch = await stakeStarOracleStrict.nextEpochToPublish();
            expect(nextEpoch).to.be.eq(
                Math.floor((currentBlock.timestamp - EPOCHS[network] - 1) / epoch_update_period) * epoch_update_period / 384
            );
          } else {
            nextEpoch = lastSetEpoch + getRandomInt(1, 500);
            const maxEpochPossible = (await stakeStarOracleStrict.timestampToEpoch(
                (await hre.ethers.provider.getBlock("latest")).timestamp)) - 1;
            nextEpoch = nextEpoch > maxEpochPossible ? maxEpochPossible : nextEpoch;
          }
          let nextBalance = currentBalance + getRandomInt(-100, 1000);

          let repeats = gasMeasureMode ? 1 : 2;
          let oracles_succeeded : { [key:number]: boolean; } = {};
          let has_consensus = false;

          const already_in_consensus = (await stakeStarOracleStrict.timestampToEpoch(
              (await stakeStarOracleStrict.latestTotalBalance()).timestamp)) === nextEpoch;

          while (repeats--) {
            let oracles_order = [...Array(ORACLES_COUNT).keys()]
            shuffleArray(oracles_order);

            for (let oracle_no of oracles_order) {
              const action_id = gasMeasureMode ? SAVE_CORRECT_ALL : getRandomInt(MIN_ACTION, MAX_ACTION);
              switch (action_id) {
                case NO_ACTION:
                  console.log("ORACLE", oracle_no, "NO ACTION");
                  break;
                case SAVE_CORRECT_ALL:
                  console.log("ORACLE", oracle_no, "SAVE CORRECT ALL", nextEpoch, nextBalance);

                  let confirmations = 0;
                  for (let i = 0; i < ORACLES_COUNT; ++i) {
                    if (i !== oracle_no && oracles_succeeded[i]) {
                      ++confirmations;
                    }
                  }

                  if (already_in_consensus) {
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

                      console.log("GOT CONSENSUS");
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

          currentBalance = (await stakeStarOracleStrict.latestTotalBalance()).totalBalance.toNumber();
          currentEpoch = await stakeStarOracleStrict.timestampToEpoch((await stakeStarOracleStrict.latestTotalBalance()).timestamp);
          lastSetEpoch = nextEpoch;
          console.log("Current Balance:", currentBalance);
          console.log("Current Epoch:", currentEpoch);

          // skip any from [0, 0.5, 1, 1.5, 2] days
          await hre.network.provider.send("evm_setNextBlockTimestamp", [
            ((await hre.ethers.provider.getBlock("latest")).timestamp
                + 1 + getRandomInt(0, 4) * (epoch_update_period / 2)),
          ]);
          await hre.network.provider.request({ method: "evm_mine", params: [] });
        }
      }

    });
  });
});
