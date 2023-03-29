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
        stakeStarOracleStrict3.save(nextEpoch1 - 1, 1200)
      ).to.be.revertedWith("epoch must increase");

      await expect(
        stakeStarOracleStrict3.save(nextEpoch1, 1200)
      ).to.be.revertedWith("balance not equals");

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

      const verbose_mode = false;
      const vlog = function(...args : any[]) {
        if (verbose_mode) console.log(...args)
      }

      const network = currentNetwork(hre);
      const epoch_update_period = 24 * 3600;
      const gasMeasureMode = false

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

      let currentBalance : number = 10000;
      let currentEpoch : number = (await stakeStarOracleStrict.nextEpochToPublish());

      await stakeStarOracleStrict1.save(currentEpoch, currentBalance);
      await stakeStarOracleStrict2.save(currentEpoch, currentBalance);
      let lastSetEpoch = currentEpoch;

      await hre.network.provider.send("evm_setNextBlockTimestamp", [
        (await hre.ethers.provider.getBlock("latest")).timestamp + epoch_update_period + 1,
      ]);
      await hre.network.provider.request({ method: "evm_mine", params: [] });

      for (let strict_mode of [true, false]) {
        vlog("StrictMode:", strict_mode);

        await stakeStarOracleStrict.setStrictEpochMode(strict_mode);

        for (let iteration = 0; iteration < 100; ++iteration) {
          vlog("ITERATION:", iteration);

          const currentBlock = await hre.ethers.provider.getBlock("latest");
          const currentBlockEpoch = await stakeStarOracleStrict.timestampToEpoch(currentBlock.timestamp)
          vlog("Current Block Timestamp:", currentBlock.timestamp, "Current Block Epoch:", currentBlockEpoch);

          let nextEpoch;
          if (strict_mode) {
            nextEpoch = await stakeStarOracleStrict.nextEpochToPublish();
            expect(nextEpoch).to.be.eq(
                Math.floor((currentBlock.timestamp - EPOCHS[network] - 1) / epoch_update_period) * epoch_update_period / 384
            );
          } else {
            nextEpoch = lastSetEpoch + getRandomInt(1, 500);
            nextEpoch = nextEpoch >= currentBlockEpoch ? currentBlockEpoch : nextEpoch;
          }
          let nextBalance = currentBalance + getRandomInt(-100, 1000);

          let repeats = gasMeasureMode ? 1 : 2;
          let oraclesSucceeded : { [key:number]: boolean; } = {};
          let has_consensus = false;

          const already_in_consensus = (await stakeStarOracleStrict.timestampToEpoch(
              (await stakeStarOracleStrict.latestTotalBalance()).timestamp)) === nextEpoch;

          let incorrectEpochs : number[] = []
          let incorrectBalances : number[] = []

          while (repeats--) {
            let oracles_order = [...Array(ORACLES_COUNT).keys()]
            shuffleArray(oracles_order);

            for (let oracleNo of oracles_order) {
              const action_id = gasMeasureMode ? SAVE_CORRECT_ALL : getRandomInt(MIN_ACTION, MAX_ACTION);
              switch (action_id) {
                case NO_ACTION: {
                  vlog("ORACLE", oracleNo, "NO ACTION");
                  break;
                }
                case SAVE_CORRECT_ALL: {
                  vlog("ORACLE", oracleNo, "SAVE CORRECT ALL", nextEpoch, nextBalance);

                  let confirmations = 0;
                  for (let i = 0; i < ORACLES_COUNT; ++i) {
                    if (i !== oracleNo && oraclesSucceeded[i]) {
                      ++confirmations;
                    }
                  }

                  if (already_in_consensus) {
                    await expect(
                      oracles[oracleNo].save(nextEpoch, nextBalance)
                    ).to.be.revertedWith("balance not equals");
                  } else {
                    if (!has_consensus && confirmations == MIN_CONSENSUS_COUNT - 1) {
                      await expect(oracles[oracleNo].save(nextEpoch, nextBalance))
                        .to.emit(oracles[oracleNo], "Proposed")
                        .withArgs(nextEpoch, nextBalance, 1 << (24 + oracleNo))
                        .and.emit(oracles[oracleNo], "Saved")
                        .withArgs(nextEpoch, nextBalance);

                      vlog("GOT CONSENSUS");
                      currentBalance = (await stakeStarOracleStrict.latestTotalBalance()).totalBalance.toNumber();
                      currentEpoch = await stakeStarOracleStrict.timestampToEpoch((await stakeStarOracleStrict.latestTotalBalance()).timestamp);
                      expect(currentBalance).to.be.eq(nextBalance);
                      expect(currentEpoch).to.be.eq(nextEpoch);

                      has_consensus = true;
                    } else {
                      await expect(oracles[oracleNo].save(nextEpoch, nextBalance))
                        .to.emit(oracles[oracleNo], "Proposed")
                        .withArgs(nextEpoch, nextBalance, 1 << (24 + oracleNo))
                        .and.not.to.emit(oracles[oracleNo], "Saved");
                    }
                  }

                  oraclesSucceeded[oracleNo] = true;

                  break;
                }

                case SAVE_CORRECT_EPOCH_INCORRECT_BALANCE: {
                  let incorrectBalance;
                  do {
                    incorrectBalance = nextBalance + (Math.random() > 0.5 ? 1 : -1) * getRandomInt(1, 1000);
                  } while (incorrectBalances.indexOf(incorrectBalance) != -1)
                  vlog("ORACLE", oracleNo, "SAVE CORRECT EPOCH INCORRECT BALANCE", nextEpoch, incorrectBalance);
                  if (already_in_consensus || has_consensus) {
                    await expect(
                      oracles[oracleNo].save(nextEpoch, incorrectBalance)
                    ).to.be.revertedWith("balance not equals");
                  } else {
                    await expect(oracles[oracleNo].save(nextEpoch, incorrectBalance))
                      .to.emit(oracles[oracleNo], "Proposed")
                      .withArgs(nextEpoch, incorrectBalance, 1 << (24 + oracleNo))
                      .and.not.to.emit(oracles[oracleNo], "Saved");

                    oraclesSucceeded[oracleNo] = false;
                    incorrectBalances.push(incorrectBalance);
                  }

                  break;
                }

                case SAVE_INCORRECT_EPOCH_CORRECT_BALANCE: {
                  let incorrectEpoch;
                  do {
                    incorrectEpoch = nextEpoch + (Math.random() > 0.5 ? 1 : -1) * getRandomInt(1, 100);
                  } while (incorrectEpochs.indexOf(incorrectEpoch) != -1);

                  vlog("ORACLE", oracleNo, "SAVE INCORRECT EPOCH CORRECT BALANCE", incorrectEpoch, nextBalance);
                  const maxEpochPossible = (await stakeStarOracleStrict.timestampToEpoch(
                      (await hre.ethers.provider.getBlock("latest")).timestamp));
                  vlog("maxEpochPossible=", maxEpochPossible);

                  if (incorrectEpoch > maxEpochPossible) {
                    await expect(
                      oracles[oracleNo].save(incorrectEpoch, nextBalance)
                    ).to.be.revertedWith("epoch from the future");
                  } else if (strict_mode) {
                    await expect(
                      oracles[oracleNo].save(incorrectEpoch, nextBalance)
                    ).to.be.revertedWith("only nextEpochToPublish() allowed");
                  } else {
                    if (incorrectEpoch <= currentEpoch) {
                      await expect(
                        oracles[oracleNo].save(incorrectEpoch, nextBalance)
                      ).to.be.revertedWith("epoch must increase");
                    } else {
                      await expect(oracles[oracleNo].save(incorrectEpoch, nextBalance))
                        .to.emit(oracles[oracleNo], "Proposed")
                        .withArgs(incorrectEpoch, nextBalance, 1 << (24 + oracleNo))
                        .and.not.to.emit(oracles[oracleNo], "Saved");

                      oraclesSucceeded[oracleNo] = false;
                      incorrectEpochs.push(incorrectEpoch);
                    }
                  }

                  break;
                }

                case SAVE_INCORRECT_EPOCH_INCORRECT_BALANCE: {
                  let incorrectEpoch;
                  do {
                    incorrectEpoch = nextEpoch + (Math.random() > 0.5 ? 1 : -1) * getRandomInt(1, 100);
                  } while (incorrectEpochs.indexOf(incorrectEpoch) != -1);

                  let incorrectBalance;
                  do {
                    incorrectBalance = nextBalance + (Math.random() > 0.5 ? 1 : -1) * getRandomInt(1, 1000);
                  } while (incorrectBalances.indexOf(incorrectBalance) != -1)

                  vlog("ORACLE", oracleNo, "SAVE INCORRECT EPOCH INCORRECT BALANCE", incorrectEpoch, incorrectBalance);
                  const maxEpochPossible = (await stakeStarOracleStrict.timestampToEpoch(
                      (await hre.ethers.provider.getBlock("latest")).timestamp));
                  vlog("maxEpochPossible=", maxEpochPossible);

                  if (incorrectEpoch > maxEpochPossible) {
                    await expect(
                      oracles[oracleNo].save(incorrectEpoch, incorrectBalance)
                    ).to.be.revertedWith("epoch from the future");
                  } else if (strict_mode) {
                    await expect(
                      oracles[oracleNo].save(incorrectEpoch, incorrectBalance)
                    ).to.be.revertedWith("only nextEpochToPublish() allowed");
                  } else {
                    if (incorrectEpoch <= currentEpoch) {
                      await expect(
                        oracles[oracleNo].save(incorrectEpoch, incorrectBalance)
                      ).to.be.revertedWith("epoch must increase");
                    } else {
                      await expect(oracles[oracleNo].save(incorrectEpoch, incorrectBalance))
                        .to.emit(oracles[oracleNo], "Proposed")
                        .withArgs(incorrectEpoch, incorrectBalance, 1 << (24 + oracleNo))
                        .and.not.to.emit(oracles[oracleNo], "Saved");

                      oraclesSucceeded[oracleNo] = false;
                      incorrectEpochs.push(incorrectEpoch);
                      incorrectBalances.push(incorrectBalance);
                    }
                  }

                  break;
                }
              }
            }
          }

          currentBalance = (await stakeStarOracleStrict.latestTotalBalance()).totalBalance.toNumber();
          currentEpoch = await stakeStarOracleStrict.timestampToEpoch((await stakeStarOracleStrict.latestTotalBalance()).timestamp);
          lastSetEpoch = nextEpoch;
          vlog("Current Balance:", currentBalance);
          vlog("Current Epoch:", currentEpoch);

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
